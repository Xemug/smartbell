import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '../../../ui/Button';
import { Modal } from '../../../ui/Modal';
import { TextField } from '../../../ui/TextField';
import { useSnackbar } from '../../../ui/useSnackbar';
import { ApiError, deleteRanch, type RanchDetail } from '../api';

// The API's own comparison: NFC, trimmed, case-folded (ranches.same_name).
const fold = (text: string) => text.normalize('NFC').trim().toLocaleLowerCase('es-MX');
const same = (a: string, b: string) => fold(a) === fold(b);

/** W 974:42223: irreversible, so the owner types the ranch's name before Borrar is enabled. */
export function DeleteRanchDialog({
  open,
  onOpenChange,
  ranch,
  onDeleted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ranch: RanchDetail;
  onDeleted: () => Promise<void>;
}) {
  const { t } = useTranslation();
  const snackbar = useSnackbar();
  const [typed, setTyped] = useState('');
  const [failure, setFailure] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const close = (next: boolean) => {
    if (deleting) return;
    if (!next) {
      setTyped('');
      setFailure(null);
    }
    onOpenChange(next);
  };

  const confirm = async () => {
    setDeleting(true);
    setFailure(null);
    try {
      await deleteRanch(ranch.id, typed);
    } catch (error) {
      setDeleting(false);
      const code = error instanceof ApiError ? error.code : '';
      setFailure(
        code === 'last_ranch'
          ? 'config.ranch.deleteLast'
          : code === 'name_mismatch'
            ? 'config.ranch.deleteMismatch'
            : 'config.ranch.deleteError',
      );
      return;
    }
    snackbar.show({ kind: 'deleted', message: t('config.ranch.deleted', { name: ranch.name }) });
    setDeleting(false);
    close(false);
    await onDeleted();
  };

  return (
    <Modal
      alert
      open={open}
      onOpenChange={close}
      title={t('config.ranch.deleteTitle', { name: ranch.name })}
      description={t('config.ranch.deleteBody')}
      closeButton={false}
    >
      <TextField
        label={t('config.ranch.deleteType')}
        placeholder={ranch.name}
        value={typed}
        autoComplete="off"
        onChange={(event) => setTyped(event.target.value)}
      />
      {failure && (
        <p role="alert" className="text-error type-body-sm">
          {t(failure)}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" disabled={deleting} onClick={() => close(false)}>
          {t('ui.back')}
        </Button>
        <Button
          type="button"
          variant="danger"
          disabled={!same(typed, ranch.name)}
          loading={deleting}
          onClick={() => void confirm()}
        >
          {t('config.ranch.deleteConfirm')}
        </Button>
      </div>
    </Modal>
  );
}
