import { useEffect, useState, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '../../../ui/Button';
import { Modal } from '../../../ui/Modal';
import { RadioGroup } from '../../../ui/RadioGroup';
import type { Animal } from './api';
import type { RemovalReason } from './listState';

const REASONS: RemovalReason[] = ['VENTA_OTRO_RANCHO', 'VENTA_RASTRO', 'MUERTE', 'ERROR_REGISTRO'];

interface RemoveAnimalsDialogProps {
  /** The animals to dar de baja; `null` keeps the dialog closed. */
  animals: Animal[] | null;
  noun: string;
  loading: boolean;
  onCancel: () => void;
  onConfirm: (reason: RemovalReason) => void;
  returnFocus?: RefObject<HTMLElement>;
}

/** Baja asks why: a sale or death keeps the record; a registration error deletes it. */
export function RemoveAnimalsDialog({
  animals,
  noun,
  loading,
  onCancel,
  onConfirm,
  returnFocus,
}: RemoveAnimalsDialogProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState<RemovalReason | ''>('');
  const open = animals !== null;
  useEffect(() => {
    if (open) setReason('');
  }, [open]);

  const count = animals?.length ?? 0;
  const title =
    count === 1
      ? t('animals.remove.titleOne', { id: animals?.[0]?.control_id })
      : t('animals.remove.titleMany', { count, noun });

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next && !loading) onCancel();
      }}
      title={title}
      description={t('animals.remove.body')}
      returnFocus={returnFocus}
      footer={
        <>
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            {t('ui.cancel')}
          </Button>
          <Button
            variant="danger"
            disabled={reason === ''}
            loading={loading}
            onClick={() => reason && onConfirm(reason)}
          >
            {t('animals.remove.confirm')}
          </Button>
        </>
      }
    >
      <RadioGroup
        label={t('animals.remove.reason')}
        options={REASONS.map((value) => ({
          value,
          label: t(`animals.remove.reasons.${value}`),
          description:
            value === 'ERROR_REGISTRO' ? t('animals.remove.errorRegistroHint') : undefined,
        }))}
        value={reason}
        onChange={(value) => setReason(value as RemovalReason)}
      />
    </Modal>
  );
}
