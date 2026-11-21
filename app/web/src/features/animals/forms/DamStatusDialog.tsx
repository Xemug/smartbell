import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '../../../ui/Button';
import { Modal } from '../../../ui/Modal';
import { Select } from '../../../ui/Select';
import { DAM_STATUSES, type DamStatus } from './formModel';

/**
 * "Estatus vaca madre" (v4 §1.7): asked when a heifer is registered with her dam. Anything but
 * "Viva en producción" gives the dam a baja in the same request.
 */
export function DamStatusDialog({
  open,
  damId,
  saving,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  damId: string;
  saving: boolean;
  onCancel: () => void;
  onConfirm: (status: DamStatus) => void;
}) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<DamStatus>('VIVA');
  useEffect(() => {
    if (open) setStatus('VIVA');
  }, [open]);

  return (
    <Modal
      open={open}
      onOpenChange={(next) => !next && !saving && onCancel()}
      title={t('animalForm.damStatus.title')}
      description={t('animalForm.damStatus.description', { id: damId })}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={saving}>
            {t('animalForm.damStatus.cancel')}
          </Button>
          <Button onClick={() => onConfirm(status)} loading={saving}>
            {t('animalForm.submit')}
          </Button>
        </>
      }
    >
      <Select
        label={t('animalForm.damStatus.label')}
        value={status}
        onChange={(value) => setStatus(value as DamStatus)}
        options={DAM_STATUSES.map((value) => ({
          value,
          label: t(`animalForm.damStatus.values.${value}`),
        }))}
      />
      {status !== 'VIVA' && (
        <p className="pt-2 text-secondary-text type-body-sm">{t('animalForm.damStatus.removes')}</p>
      )}
    </Modal>
  );
}
