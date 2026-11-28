import { useEffect, useState, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
import { Select } from '../../ui/Select';
import { useSnackbar } from '../../ui/useSnackbar';
import { useGroupList, useMoveAnimals } from './api';
import { groupName, movableGroups } from './labels';

interface MoveToGroupDialogProps {
  /** The animals to move; `null` keeps the dialog closed. */
  animalIds: string[] | null;
  /** Left out of the destinations: the group they are being moved from. */
  fromGroupId?: string;
  /** Moving bulls: only bull groups are offered. Otherwise only cow potreros. */
  bulls?: boolean;
  onClose: () => void;
  onMoved?: (moved: string[]) => void;
  returnFocus?: RefObject<HTMLElement>;
}

/** C6 Move: pick the destination, then "Se moverán N vacas al potrero X". AUTO groups pick their
 * own cows, so they aren't offered. */
export function MoveToGroupDialog({
  animalIds,
  fromGroupId,
  bulls = false,
  onClose,
  onMoved,
  returnFocus,
}: MoveToGroupDialogProps) {
  const { t } = useTranslation();
  const snackbar = useSnackbar();
  const groups = useGroupList();
  const move = useMoveAnimals();
  const [target, setTarget] = useState('');
  const [failed, setFailed] = useState<string | null>(null);
  const open = animalIds !== null;
  useEffect(() => {
    if (open) {
      setTarget('');
      setFailed(null);
    }
  }, [open]);

  const options = movableGroups(groups.data ?? [], bulls)
    .filter((g) => g.id !== fromGroupId)
    .map((g) => ({ value: g.id, label: groupName(g, t) }));
  const count = animalIds?.length ?? 0;
  const name = options.find((o) => o.value === target)?.label ?? '';

  const confirm = () => {
    if (!animalIds || !target) return;
    move.mutate(
      { groupId: target, animalIds },
      {
        onSuccess: (result) => {
          snackbar.show({
            kind: 'success',
            message: t('groups.moveDialog.done', { count: result.moved.length, name }),
          });
          onClose();
          onMoved?.([...result.moved, ...result.unchanged]);
        },
        onError: (failure) => setFailed(failure.message),
      },
    );
  };

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next && !move.isPending) onClose();
      }}
      title={t('groups.moveDialog.title')}
      description={
        target ? t('groups.moveDialog.body', { count, name }) : t('groups.moveDialog.pickTarget')
      }
      returnFocus={returnFocus}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={move.isPending}>
            {t('ui.cancel')}
          </Button>
          <Button loading={move.isPending} disabled={!target} onClick={confirm}>
            {t('groups.moveDialog.confirm')}
          </Button>
        </>
      }
    >
      <Select
        label={t('groups.moveDialog.target')}
        error={
          failed === 'bull_semen_only'
            ? t('groups.bulls.semenOnly')
            : failed
              ? t('groups.moveDialog.error')
              : undefined
        }
        options={options}
        value={target}
        onChange={setTarget}
      />
    </Modal>
  );
}
