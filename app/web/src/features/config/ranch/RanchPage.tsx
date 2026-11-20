import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { useActiveRanch } from '../../../app/useActiveRanch';
import { Button } from '../../../ui/Button';
import { FormField } from '../../../ui/FormField';
import { iconPencil, iconPlus, iconTrash } from '../../../ui/icons/glyphs';
import { Spinner } from '../../../ui/Spinner';
import { TextField } from '../../../ui/TextField';
import { useSnackbar } from '../../../ui/useSnackbar';
import { useAuth } from '../../auth/useAuth';
import { getRanch, updateRanch, type RanchCreation, type RanchDetail } from '../api';
import { ConfigLayout } from '../ConfigLayout';
import { AddRanchDialog, UpsellDialog } from './AddRanchDialog';
import { DeleteRanchDialog } from './DeleteRanchDialog';
import { addressAt, formatCoordinates, geocodeAddress } from './geocode';
import { roundPin, type Pin } from './pin';

const RanchMap = lazy(() => import('./RanchMap'));

type Lookup = 'idle' | 'busy' | 'naming' | 'approx' | 'missed' | 'failed';
/** What the line under the map says while editing, by the state of the address lookup. */
const LOOKUP_HINT: Record<Lookup, string> = {
  idle: 'config.ranch.mapHint',
  busy: 'config.ranch.locating',
  naming: 'config.ranch.naming',
  approx: 'config.ranch.approximate',
  missed: 'config.ranch.notFound',
  failed: 'config.ranch.lookupFailed',
};

const schema = z.object({
  name: z.string().trim().min(1, 'config.ranch.nameRequired').max(120),
  address: z.string().trim().min(1, 'config.ranch.addressRequired').max(300),
  pin: z.object({ latitude: z.number(), longitude: z.number() }).nullable(),
});
type Values = z.infer<typeof schema>;

const valuesOf = (ranch: RanchDetail): Values => ({
  name: ranch.name,
  address: ranch.address ?? '',
  pin:
    ranch.latitude !== null && ranch.longitude !== null
      ? { latitude: ranch.latitude, longitude: ranch.longitude }
      : null,
});

const ranchKey = (id: string) => ['ranch', id] as const;
const counter = (n: number) => String(n).padStart(3, '0');

/** Datos Rancho: M 1697-93765 / E6 2524-148618 on a phone, W 1315-56000 from 960px. */
export function RanchPage() {
  const { t } = useTranslation();
  const { activeRanch } = useActiveRanch();
  const query = useQuery({
    queryKey: ranchKey(activeRanch.id),
    queryFn: getRanch,
    enabled: Boolean(activeRanch.id),
  });
  return (
    <ConfigLayout intro={t('config.ranch.intro')}>
      {query.data ? (
        // Remount per ranch so a switch never shows the last ranch's form.
        <RanchForm key={query.data.id} ranch={query.data} />
      ) : query.isError ? (
        <p role="alert" className="text-error type-body-md">
          {t('config.ranch.loadError')}{' '}
          <Button variant="ghost" size="sm" onClick={() => void query.refetch()}>
            {t('config.ranch.retry')}
          </Button>
        </p>
      ) : (
        <div className="flex justify-center p-8">
          <Spinner size={32} />
        </div>
      )}
    </ConfigLayout>
  );
}

function RanchForm({ ranch }: { ranch: RanchDetail }) {
  const { t } = useTranslation();
  const auth = useAuth();
  const { ranches, setActiveRanch } = useActiveRanch();
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();
  const [editing, setEditing] = useState(false);
  const [saveError, setSaveError] = useState(false);
  // After a change that already succeeded. If the re-read fails, the switcher stays stale until
  // the next load; that mustn't turn the success into an error.
  const refresh = () => auth.refreshAccount().catch(() => undefined);
  const [dialog, setDialog] = useState<'add' | 'upsell' | 'delete' | null>(null);
  // A ranch just created or kept after a delete: switched to once the account lists it.
  const [switchTo, setSwitchTo] = useState<string | null>(null);
  const creation: RanchCreation =
    auth.state.status === 'signedIn' ? auth.state.account.ranch_creation : 'upsell';

  const { control, handleSubmit, formState, getValues, reset, setValue } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: valuesOf(ranch),
  });
  const pin = useWatch({ control, name: 'pin' });
  // The address the pin was last placed for, so a new address moves the pin to it once.
  const locatedFor = useRef(ranch.address?.trim() ?? '');
  const lookup = useRef(0); // Bumped by every lookup and every hand move: stale answers lose.
  const [locating, setLocating] = useState<Lookup>('idle');

  useEffect(() => {
    if (switchTo && ranches.some((r) => r.id === switchTo)) {
      setActiveRanch(switchTo);
      setSwitchTo(null);
    }
  }, [switchTo, ranches, setActiveRanch]);

  const placePin = (next: Pin) =>
    setValue('pin', roundPin(next), { shouldDirty: true, shouldValidate: true });

  // The lookup in flight, so Guardar waits for it instead of saving the old pin.
  const pending = useRef<Promise<void>>(Promise.resolve());

  const clearPin = () => setValue('pin', null, { shouldDirty: true, shouldValidate: true });

  /** Moves the pin to a changed address. A pin moved by hand afterwards wins. */
  const locate = (): Promise<void> => {
    const address = getValues('address').trim();
    if (!address || address === locatedFor.current) return pending.current;
    locatedFor.current = address;
    const mine = ++lookup.current;
    setLocating('busy');
    pending.current = geocodeAddress(address).then(
      (found) => {
        if (mine !== lookup.current) return;
        // A new address the map can't place drops the old pin: it marks a different place now.
        if (found) placePin(found.pin);
        else clearPin();
        setLocating(!found ? 'missed' : found.exact ? 'idle' : 'approx');
      },
      () => {
        if (mine !== lookup.current) return;
        locatedFor.current = ''; // Offline or throttled: leaving the field again retries.
        clearPin();
        setLocating('failed');
      },
    );
    return pending.current;
  };

  const cancel = () => {
    lookup.current++;
    locatedFor.current = ranch.address?.trim() ?? '';
    setLocating('idle');
    reset(valuesOf(ranch));
    setSaveError(false);
    setEditing(false);
  };

  const submit = handleSubmit(async ({ name }) => {
    setSaveError(false);
    await locate(); // Guardar straight after typing or dropping: pin and address match first.
    const address = getValues('address').trim();
    const saved = getValues('pin');
    try {
      const result = await updateRanch({
        name,
        address,
        // A saved pin the new address couldn't place is cleared, not left behind.
        ...(saved
          ? roundPin(saved)
          : ranch.latitude !== null
            ? { latitude: null, longitude: null }
            : {}),
      });
      queryClient.setQueryData(ranchKey(result.id), result);
      reset(valuesOf(result));
      locatedFor.current = result.address?.trim() ?? '';
      setEditing(false);
      snackbar.show({ kind: 'success', message: t('config.ranch.saved') });
    } catch {
      setSaveError(true);
      return;
    }
    void refresh(); // The switcher and header show the new name.
  });

  /** A pin dropped or dragged by hand: it wins, and the address follows it. */
  const movePin = (next: Pin) => {
    const mine = ++lookup.current;
    const pin = roundPin(next);
    placePin(pin);
    setLocating('naming');
    const name = (address: string) => {
      setValue('address', address, { shouldDirty: true, shouldValidate: true });
      locatedFor.current = address.trim(); // Already where it says: no lookup back.
      setLocating('idle');
    };
    pending.current = addressAt(pin).then(
      (address) => {
        if (mine === lookup.current) name(address ?? formatCoordinates(pin));
      },
      () => {
        if (mine === lookup.current) name(formatCoordinates(pin));
      },
    );
  };

  const openAdd = () => setDialog(creation === 'allowed' ? 'add' : 'upsell');
  const others = ranches.filter((r) => r.id !== ranch.id);
  const fallback = others[0]; // Where the app goes once this ranch is deleted.

  return (
    <>
      <div className="flex items-center rounded-moon-i-sm bg-primary px-4 py-3 text-button-text">
        <h2 className="truncate type-label-lg">{t('config.ranch.header', { name: ranch.name })}</h2>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          leadingIcon={iconPlus}
          disabled={creation === 'limit'}
          onClick={openAdd}
        >
          {t('config.ranch.add')}
        </Button>
        <p className="text-secondary-text type-label-md">
          {t('config.ranch.ranchCount')} |{' '}
          <span className="text-primary">{counter(ranches.length)}</span>
        </p>
      </div>
      {creation === 'limit' && (
        <p className="text-secondary-text type-body-sm">{t('config.ranch.limit')}</p>
      )}

      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-secondary-text type-label-md">
            {t('config.ranch.animalCount')} |{' '}
            <span className="text-primary">{counter(ranch.animal_count)}</span>
          </p>
          {ranch.can_edit && !editing && (
            <Button
              type="button"
              variant="ghost"
              leadingIcon={iconPencil}
              onClick={() => setEditing(true)}
            >
              {t('config.ranch.edit')}
            </Button>
          )}
        </div>
        {!ranch.can_edit && (
          <p className="text-secondary-text type-body-sm">{t('config.ranch.readOnly')}</p>
        )}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <FormField
              control={control}
              name="name"
              render={(field) => (
                <TextField
                  {...field}
                  label={t('config.ranch.name')}
                  placeholder={t('config.ranch.namePlaceholder')}
                  required
                  disabled={!editing}
                />
              )}
            />
            <FormField
              control={control}
              name="address"
              render={(field) => (
                <TextField
                  {...field}
                  onBlur={() => {
                    field.onBlur();
                    void locate();
                  }}
                  autoComplete="street-address"
                  label={t('config.ranch.address')}
                  placeholder={t('config.ranch.addressPlaceholder')}
                  required
                  disabled={!editing}
                />
              )}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Suspense
              fallback={<div className="h-64 w-full rounded-moon-i-sm bg-neutral-2 lg:h-80" />}
            >
              <RanchMap
                pin={pin}
                editable={editing}
                onMove={movePin}
                label={t('config.ranch.map')}
              />
            </Suspense>
            <p className="text-secondary-text type-body-sm" aria-live="polite">
              {editing
                ? t(LOOKUP_HINT[locating])
                : pin
                  ? ranch.can_edit
                    ? t('config.ranch.mapReadOnly')
                    : ''
                  : t('config.ranch.noPin')}
            </p>
          </div>
        </div>
        {saveError && (
          <p role="alert" className="text-error type-body-sm">
            {t('config.ranch.saveError')}
          </p>
        )}
        {editing && (
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={cancel}>
              {t('ui.cancel')}
            </Button>
            {/* Web 1.5: Guardar is disabled until something changes or while a field is empty. */}
            <Button type="submit" disabled={!formState.isDirty} loading={formState.isSubmitting}>
              {t('config.ranch.save')}
            </Button>
          </div>
        )}
      </form>

      {ranch.is_owner && (
        <div className="flex flex-col items-start gap-1 border-t pt-4">
          <Button
            type="button"
            variant="danger"
            leadingIcon={iconTrash}
            disabled={others.length === 0}
            onClick={() => setDialog('delete')}
          >
            {t('config.ranch.delete')}
          </Button>
          {others.length === 0 && (
            <p className="text-secondary-text type-body-sm">{t('config.ranch.deleteLast')}</p>
          )}
        </div>
      )}

      <AddRanchDialog
        open={dialog === 'add'}
        onOpenChange={(open) => setDialog(open ? 'add' : null)}
        onUpsell={() => setDialog('upsell')}
        onCreated={async (id) => {
          setSwitchTo(id);
          await refresh();
        }}
      />
      <UpsellDialog
        open={dialog === 'upsell'}
        onOpenChange={(open) => setDialog(open ? 'upsell' : null)}
      />
      {fallback && (
        <DeleteRanchDialog
          open={dialog === 'delete'}
          onOpenChange={(open) => setDialog(open ? 'delete' : null)}
          ranch={ranch}
          onDeleted={async () => {
            setActiveRanch(fallback.id);
            await refresh();
          }}
        />
      )}
    </>
  );
}
