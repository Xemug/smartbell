import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
import { Select } from '../../ui/Select';
import { useSnackbar } from '../../ui/useSnackbar';
import { useDeleteGroup, useGroupList, type GroupOut } from './api';
import { groupName, isBullGroup, movableGroups } from './labels';

/** A bull group's bulls can be left in no group: there is no General for bulls. */
const NO_GROUP = 'NONE';

interface DeleteGroupDialogProps {
  /** The group to delete; `null` keeps the dialog closed. */
  group: GroupOut | null;
  onClose: () => void;
  onDeleted?: () => void;
}

/** C4: the cows need a new home, General unless the user picks another. A bull group's bulls go
 * to no group unless another bull group is picked. */
export function DeleteGroupDialog({ group, onClose, onDeleted }: DeleteGroupDialogProps) {
  const { t } = useTranslation();
  const snackbar = useSnackbar();
  const groups = useGroupList();
  const remove = useDeleteGroup();
  const [target, setTarget] = useState('');
  const [failed, setFailed] = useState(false);
  const bulls = group ? isBullGroup(group) : false;
  const others = movableGroups(groups.data ?? [], bulls).filter((g) => g.id !== group?.id);
  const general = others.find((g) => g.preset === 'GENERAL');

  useEffect(() => {
    if (group) {
      setTarget(bulls ? NO_GROUP : (general?.id ?? ''));
      setFailed(false);
    }
    // Only a newly opened dialog resets the pick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group?.id, general?.id, bulls]);

  if (!group) return null;
  const name = groupName(group, t);

  // Awaited rather than passed as callbacks: the page under the dialog may unmount once the
  // group is gone, and mutate's own callbacks would then never run.
  const confirm = async () => {
    let result;
    try {
      const toGroupId = target && target !== NO_GROUP ? target : null;
      result = await remove.mutateAsync({ id: group.id, toGroupId });
    } catch {
      setFailed(true);
      return;
    }
    const to = others.find((g) => g.id === result.to_group_id);
    snackbar.show({
      kind: 'deleted',
      message: result.to_group_id
        ? t('groups.deleteDialog.done', { to: to ? groupName(to, t) : result.to_group })
        : t('groups.bulls.deletedOut'),
    });
    onClose();
    onDeleted?.();
  };

  return (
    <Modal
      open
      onOpenChange={(open) => {
        if (!open && !remove.isPending) onClose();
      }}
      title={t('groups.deleteDialog.title', { name })}
      description={t(bulls ? 'groups.bulls.deleteBody' : 'groups.deleteDialog.body')}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={remove.isPending}>
            {t('ui.cancel')}
          </Button>
          <Button
            variant="danger"
            loading={remove.isPending}
            disabled={!target}
            onClick={() => void confirm()}
          >
            {t('groups.deleteDialog.confirm')}
          </Button>
        </>
      }
    >
      <Select
        label={t('groups.deleteDialog.target')}
        error={failed ? t('groups.deleteDialog.error') : undefined}
        options={[
          ...(bulls ? [{ value: NO_GROUP, label: t('groups.bulls.noGroup') }] : []),
          ...others.map((g) => ({ value: g.id, label: groupName(g, t) })),
        ]}
        value={target}
        onChange={setTarget}
      />
    </Modal>
  );
}
