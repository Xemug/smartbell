import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '../../../ui/Button';
import { ConfirmDialog } from '../../../ui/ConfirmDialog';
import { iconEdit } from '../../../ui/icons/glyphs';
import { Modal } from '../../../ui/Modal';
import { RadioGroup } from '../../../ui/RadioGroup';
import { Select } from '../../../ui/Select';
import { useSnackbar } from '../../../ui/useSnackbar';
import { useGroupList, type GroupOut } from '../../groups/api';
import { groupName, movableGroups } from '../../groups/labels';
import {
  useChangeGroup,
  useSetBullAvailability,
  type AnimalDetail,
  type BullAvailability,
} from './api';

const AVAILABILITIES: BullAvailability[] = ['EN_RANCHO', 'SEMEN', 'AMBOS'];

/** One fact of the profile, with its Cambiar when the user may change it. */
function Fact({
  label,
  value,
  action,
}: {
  label: string;
  value: string;
  action?: { label: string; onClick: () => void };
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-secondary-text type-label-sm">{label}</span>
        <span className="truncate type-body-md">{value}</span>
      </div>
      {action && (
        <Button
          variant="ghost"
          size="sm"
          leadingIcon={iconEdit}
          aria-label={action.label}
          onClick={action.onClick}
        >
          {t('profile.cambiar')}
        </Button>
      )}
    </div>
  );
}

/** The group she is in: none is General (domain-model §7). A bull with none is in no group. */
function currentGroup(
  animal: AnimalDetail,
  groups: GroupOut[],
  bull: boolean,
): GroupOut | undefined {
  if (animal.group_id) return groups.find((g) => g.id === animal.group_id);
  return bull ? undefined : groups.find((g) => g.preset === 'GENERAL');
}

/** A cow's potrero, or a bull's bull group; Cambiar moves the animal to another MANUAL group of
 * its own kind with a GROUP_CHANGE. */
export function GroupFact({ animal, editable }: { animal: AnimalDetail; editable: boolean }) {
  const { t } = useTranslation();
  const snackbar = useSnackbar();
  const groups = useGroupList();
  const move = useChangeGroup(animal.id);
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState('');
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (open) {
      setTarget('');
      setFailed(false);
    }
  }, [open]);

  const bull = animal.kind === 'TORO';
  const copy = bull ? 'profile.potrero.bull' : 'profile.potrero';
  const list = groups.data ?? [];
  const current = currentGroup(animal, list, bull);
  const value = current
    ? groupName(current, t)
    : animal.group_id
      ? t('animals.none')
      : bull
        ? t('groups.bulls.noGroup')
        : t('animals.values.grupo.GENERAL');
  // AUTO potreros pick their own cows, so they aren't offered; kinds never mix.
  const options = movableGroups(list, bull).map((g) =>
    g.id === current?.id
      ? {
          value: g.id,
          label: t('profile.potrero.current', { name: groupName(g, t) }),
          disabled: true,
        }
      : { value: g.id, label: groupName(g, t) },
  );
  const name = list.find((g) => g.id === target);

  const confirm = () => {
    if (!target || !name) return;
    move.mutate(
      { toGroupId: target, on: format(new Date(), 'yyyy-MM-dd') },
      {
        onSuccess: () => {
          snackbar.show({
            kind: 'success',
            message: t(`${copy}.done`, { id: animal.control_id, name: groupName(name, t) }),
          });
          setOpen(false);
        },
        onError: () => setFailed(true),
      },
    );
  };

  return (
    <>
      <Fact
        label={t(`${copy}.label`)}
        value={value}
        action={editable ? { label: t(`${copy}.change`), onClick: () => setOpen(true) } : undefined}
      />
      <Modal
        open={open}
        onOpenChange={(next) => {
          if (!next && !move.isPending) setOpen(false);
        }}
        title={t(`${copy}.title`)}
        description={
          name
            ? t(`${copy}.body`, { id: animal.control_id, name: groupName(name, t) })
            : t(`${copy}.pick`, { id: animal.control_id })
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={move.isPending}>
              {t('ui.cancel')}
            </Button>
            <Button loading={move.isPending} disabled={!name} onClick={confirm}>
              {t('profile.potrero.save')}
            </Button>
          </>
        }
      >
        <Select
          label={t('profile.potrero.target')}
          error={failed ? t('profile.potrero.error') : undefined}
          options={options}
          value={target}
          onChange={(value) => {
            setTarget(value);
            setFailed(false);
          }}
        />
      </Modal>
    </>
  );
}

/** A bull's availability. Going to Solo semen freezes his records, so it asks first. */
export function AvailabilityFact({
  animal,
  editable,
}: {
  animal: AnimalDetail & { bull_availability: BullAvailability };
  editable: boolean;
}) {
  const { t } = useTranslation();
  const snackbar = useSnackbar();
  const save = useSetBullAvailability(animal.id);
  const current = animal.bull_availability;
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [choice, setChoice] = useState<BullAvailability>(current);
  const [failed, setFailed] = useState(false);
  // Reset when the picker opens only: the refetch after saving must not reopen it.
  useEffect(() => {
    if (open) {
      setChoice(current);
      setConfirming(false);
      setFailed(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const label = (value: BullAvailability) => t(`animals.values.disponibilidad.${value}`);
  const close = () => {
    if (!save.isPending) setOpen(false);
  };
  const commit = () =>
    save.mutate(choice, {
      onSuccess: () => {
        snackbar.show({
          kind: 'success',
          message: t('profile.availability.done', { id: animal.control_id, value: label(choice) }),
        });
        setOpen(false);
      },
      onError: () => {
        setConfirming(false);
        setFailed(true);
      },
    });
  const submit = () => {
    if (choice === current) setOpen(false);
    else if (choice === 'SEMEN') setConfirming(true);
    else commit();
  };

  return (
    <>
      <Fact
        label={t('profile.availability.label')}
        value={label(current)}
        action={
          editable
            ? { label: t('profile.availability.change'), onClick: () => setOpen(true) }
            : undefined
        }
      />
      <Modal
        open={open && !confirming}
        onOpenChange={(next) => {
          if (!next) close();
        }}
        title={t('profile.availability.title')}
        description={t('profile.availability.pick', { id: animal.control_id })}
        footer={
          <>
            <Button variant="outline" onClick={close} disabled={save.isPending}>
              {t('ui.cancel')}
            </Button>
            <Button loading={save.isPending} onClick={submit}>
              {t('profile.availability.save')}
            </Button>
          </>
        }
      >
        <RadioGroup
          label={t('profile.availability.label')}
          error={failed ? t('profile.availability.error') : undefined}
          options={AVAILABILITIES.map((value) => ({ value, label: label(value) }))}
          value={choice}
          onChange={(value) => setChoice(value as BullAvailability)}
        />
      </Modal>
      <ConfirmDialog
        open={open && confirming}
        // Cancelling goes back to the picker: nothing has changed.
        onOpenChange={(next) => {
          if (!next) setConfirming(false);
        }}
        title={t('profile.availability.confirmTitle', { id: animal.control_id })}
        description={t('profile.availability.confirmBody')}
        confirmLabel={t('profile.availability.confirm')}
        loading={save.isPending}
        onConfirm={commit}
      />
    </>
  );
}
