import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
import { Select } from '../../ui/Select';
import { useSnackbar } from '../../ui/useSnackbar';
import { useDeleteGroup, useGroupList, type GroupOut } from './api';
import { groupName } from './labels';

interface DeleteGroupDialogProps {
  /** The group to delete; `null` keeps the dialog closed. */
  group: GroupOut | null;
  onClose: () => void;
  onDeleted?: () => void;
}

/** C4: the cows need a new home, General unless the user picks another. */
export function DeleteGroupDialog({ group, onClose, onDeleted }: DeleteGroupDialogProps) {
  const { t } = useTranslation();
  const snackbar = useSnackbar();
  const groups = useGroupList();
  const remove = useDeleteGroup();
  const [target, setTarget] = useState('');
  const [failed, setFailed] = useState(false);
  const others = (groups.data ?? []).filter((g) => g.id !== group?.id && g.selection !== 'AUTO');
  const general = others.find((g) => g.preset === 'GENERAL');

  useEffect(() => {
    if (group) {
      setTarget(general?.id ?? '');
      setFailed(false);
    }
    // Only a newly opened dialog resets the pick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group?.id, general?.id]);

  if (!group) return null;
  const name = groupName(group, t);

  const confirm = () =>
    remove.mutate(
      { id: group.id, toGroupId: target || null },
      {
        onSuccess: (result) => {
          const to = others.find((g) => g.id === result.to_group_id);
          snackbar.show({
            kind: 'deleted',
            message: t('groups.deleteDialog.done', { to: to ? groupName(to, t) : result.to_group }),
          });
          onClose();
          onDeleted?.();
        },
        onError: () => setFailed(true),
      },
    );

  return (
    <Modal
      open
      onOpenChange={(open) => {
        if (!open && !remove.isPending) onClose();
      }}
      title={t('groups.deleteDialog.title', { name })}
      description={t('groups.deleteDialog.body')}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={remove.isPending}>
            {t('ui.cancel')}
          </Button>
          <Button variant="danger" loading={remove.isPending} disabled={!target} onClick={confirm}>
            {t('groups.deleteDialog.confirm')}
          </Button>
        </>
      }
    >
      <Select
        label={t('groups.deleteDialog.target')}
        error={failed ? t('groups.deleteDialog.error') : undefined}
        options={others.map((g) => ({ value: g.id, label: groupName(g, t) }))}
        value={target}
        onChange={setTarget}
      />
    </Modal>
  );
}
