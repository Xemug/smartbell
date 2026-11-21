import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useState, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Avatar } from '../../../app/Avatar';
import { Button } from '../../../ui/Button';
import { FormField } from '../../../ui/FormField';
import { iconCamera, iconLock, iconPencil } from '../../../ui/icons/glyphs';
import { PhoneField } from '../../../ui/PhoneField';
import { TextField } from '../../../ui/TextField';
import { useSnackbar } from '../../../ui/useSnackbar';
import { useAuth, useOptionalAuth } from '../../auth/useAuth';
import { ApiError, PHOTO_TYPES, photoProblem, updateProfile, uploadPhoto, type User } from '../api';
import { ConfigLayout } from '../ConfigLayout';
import { PasswordDialog } from './PasswordDialog';

// Web 1.4: +52 numbers have 10 digits; other codes only need a plausible E.164 length.
const schema = z.object({
  first_name: z.string().trim().min(1, 'config.account.nameRequired').max(100),
  last_name: z.string().trim().max(100),
  phone: z
    .string()
    .min(1, 'config.account.phoneRequired')
    .refine((v) => (v.startsWith('+52') ? /^\+52\d{10}$/ : /^\+[1-9]\d{7,14}$/).test(v), {
      message: 'config.account.phoneShort',
    }),
});
type Values = z.infer<typeof schema>;

const valuesOf = (user: User): Values => ({
  first_name: user.first_name,
  last_name: user.last_name ?? '',
  phone: user.phone ?? '',
});

/** Mi cuenta: M 1691-824 / E2 2524-149062 on a phone, W 49-1365 from 960px. Free for everyone. */
export function AccountPage() {
  const { t } = useTranslation();
  // Optional: the shell's own tests render routes without auth. RequireAuth guards the real app.
  const auth = useOptionalAuth();
  if (auth?.state.status !== 'signedIn') return null;
  const user = auth.state.account.user;
  return (
    <ConfigLayout intro={t('config.intro')}>
      {/* Remount on a new user so the form never shows someone else's values. */}
      <AccountForm key={user.id} user={user} />
    </ConfigLayout>
  );
}

function AccountForm({ user }: { user: User }) {
  const { t } = useTranslation();
  const { setUser, canChangePassword } = useAuth();
  const snackbar = useSnackbar();
  const [editing, setEditing] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const { control, handleSubmit, formState, reset } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: valuesOf(user),
  });

  const cancel = () => {
    reset(valuesOf(user));
    setSaveError(false);
    setEditing(false);
  };

  const submit = handleSubmit(async (values) => {
    setSaveError(false);
    try {
      const saved = await updateProfile({
        first_name: values.first_name,
        last_name: values.last_name,
        phone: values.phone,
      });
      setUser(saved);
      reset(valuesOf(saved));
      setEditing(false);
      snackbar.show({ kind: 'success', message: t('config.account.saved') });
    } catch {
      setSaveError(true);
    }
  });

  return (
    <>
      <PhotoPicker user={user} onSaved={setUser} />
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="ramp-card-title text-primary">{t('config.account.general')}</h2>
          {!editing && (
            <Button
              type="button"
              variant="ghost"
              leadingIcon={iconPencil}
              onClick={() => setEditing(true)}
            >
              {t('config.account.edit')}
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <FormField
            control={control}
            name="first_name"
            render={(field) => (
              <TextField
                {...field}
                autoComplete="given-name"
                label={t('config.account.firstName')}
                required
                disabled={!editing}
              />
            )}
          />
          <FormField
            control={control}
            name="last_name"
            render={(field) => (
              <TextField
                {...field}
                autoComplete="family-name"
                label={t('config.account.lastName')}
                disabled={!editing}
              />
            )}
          />
          <FormField
            control={control}
            name="phone"
            render={(field) => (
              <PhoneField
                {...field}
                label={t('config.account.phone')}
                placeholder="33-3456-7890"
                required
                disabled={!editing}
              />
            )}
          />
          <TextField
            type="email"
            label={t('config.account.email')}
            value={user.email}
            hint={t('config.account.emailHint')}
            disabled
            readOnly
          />
        </div>
        {saveError && (
          <p role="alert" className="text-error type-body-sm">
            {t('config.account.saveError')}
          </p>
        )}
        {editing && (
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={cancel}>
              {t('ui.cancel')}
            </Button>
            {/* Web 1.4: Guardar stays disabled until something changes. */}
            <Button type="submit" disabled={!formState.isDirty} loading={formState.isSubmitting}>
              {t('config.account.save')}
            </Button>
          </div>
        )}
      </form>
      <div className="flex flex-col gap-2 border-t pt-4">
        {canChangePassword() ? (
          <>
            <div>
              <Button
                type="button"
                variant="outline"
                leadingIcon={iconLock}
                onClick={() => setPasswordOpen(true)}
              >
                {t('config.account.password.open')}
              </Button>
            </div>
            <PasswordDialog
              open={passwordOpen}
              onOpenChange={setPasswordOpen}
              name={user.first_name}
            />
          </>
        ) : (
          <p className="text-secondary-text type-body-sm">{t('config.account.password.social')}</p>
        )}
      </div>
    </>
  );
}

function PhotoPicker({ user, onSaved }: { user: User; onSaved: (user: User) => void }) {
  const { t } = useTranslation();
  const snackbar = useSnackbar();
  const input = useRef<HTMLInputElement>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const pick = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // Choosing the same file again must fire again.
    if (!file) return;
    const local = photoProblem(file);
    if (local) {
      setProblem(`config.account.${local}`);
      return;
    }
    setProblem(null);
    setUploading(true);
    try {
      onSaved(await uploadPhoto(file));
      snackbar.show({ kind: 'success', message: t('config.account.photoSaved') });
    } catch (error) {
      const code = error instanceof ApiError ? error.code : '';
      setProblem(
        code === 'photo_too_large'
          ? 'config.account.photoSize'
          : code === 'photo_type'
            ? 'config.account.photoType'
            : 'config.account.photoError',
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Avatar photoUrl={user.photo_url} className="size-20 shrink-0" />
      <div className="flex min-w-0 flex-col items-start gap-1">
        <input
          ref={input}
          type="file"
          accept={PHOTO_TYPES.join(',')}
          className="hidden"
          aria-label={t('config.account.photo')}
          onChange={(event) => void pick(event)}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          leadingIcon={iconCamera}
          loading={uploading}
          onClick={() => input.current?.click()}
        >
          {t(user.photo_url ? 'config.account.changePhoto' : 'config.account.addPhoto')}
        </Button>
        <p className="text-secondary-text type-body-sm">{t('config.account.photoHint')}</p>
        {problem && (
          <p role="alert" className="text-error type-body-sm">
            {t(problem)}
          </p>
        )}
      </div>
    </div>
  );
}
