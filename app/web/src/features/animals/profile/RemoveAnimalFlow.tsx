import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { useSupportLinks } from '../../../app/support';
import { Button } from '../../../ui/Button';
import { cx, focusRing } from '../../../ui/cx';
import { Modal } from '../../../ui/Modal';
import { RadioGroup } from '../../../ui/RadioGroup';
import { useSnackbar } from '../../../ui/useSnackbar';
import { ApiError } from '../list/api';
import type { RemovalReason } from '../list/listState';
import { useRemoveAnimal, type AnimalDetail } from './api';

const REASONS: RemovalReason[] = ['VENTA_OTRO_RANCHO', 'VENTA_RASTRO', 'MUERTE', 'ERROR_REGISTRO'];

type Step = 'reason' | 'confirm' | 'done';

interface RemoveAnimalFlowProps {
  animal: AnimalDetail;
  open: boolean;
  onClose: () => void;
  /** Called once an Error al registrar deleted the animal: the profile has nothing left. */
  onDeleted: () => void;
}

/** Baja de ganado (mobile-core B3, event-flows 1.12): reason → confirm → done. */
export function RemoveAnimalFlow({ animal, open, onClose, onDeleted }: RemoveAnimalFlowProps) {
  const { t } = useTranslation();
  const { show } = useSnackbar();
  const links = useSupportLinks();
  const remove = useRemoveAnimal(animal.id);
  const [step, setStep] = useState<Step>('reason');
  const [reason, setReason] = useState<RemovalReason | ''>('');
  const [deleted, setDeleted] = useState(false);

  useEffect(() => {
    if (open) {
      setStep('reason');
      setReason('');
      setDeleted(false);
    }
  }, [open]);

  const noun = t(`profile.kinds.${animal.kind}`).toLowerCase();
  const vars = { noun, id: animal.control_id };
  const close = () => {
    if (remove.isPending) return;
    onClose();
    if (deleted) onDeleted();
  };

  const submit = () => {
    if (!reason) return;
    remove.mutate(reason, {
      onSuccess: (wasDeleted) => {
        setDeleted(wasDeleted);
        setStep('done');
      },
      onError: (error) =>
        show({
          kind: 'error',
          message:
            error instanceof ApiError && error.code === 'animal_in_use'
              ? t('profile.baja.inUse')
              : t('profile.baja.error'),
        }),
    });
  };

  let title: string;
  let body: ReactNode;
  let footer: ReactNode;
  if (step === 'reason') {
    title = t('profile.baja.intro', vars);
    body = (
      <RadioGroup
        label={t('profile.baja.ask')}
        options={REASONS.map((value) => ({ value, label: t(`profile.baja.reasons.${value}`) }))}
        value={reason}
        onChange={(value) => setReason(value as RemovalReason)}
      />
    );
    footer = (
      <>
        <Button variant="outline" onClick={close}>
          {t('ui.back')}
        </Button>
        <Button variant="danger" disabled={!reason} onClick={() => setStep('confirm')}>
          {t('profile.baja.submit')}
        </Button>
      </>
    );
  } else if (step === 'confirm' && reason) {
    title = t(`profile.baja.confirmTitle.${reason}`, vars);
    body = <p className="type-body-md">{t(`profile.baja.confirmBody.${reason}`, vars)}</p>;
    footer = (
      <>
        <Button variant="outline" onClick={() => setStep('reason')} disabled={remove.isPending}>
          {t('ui.back')}
        </Button>
        <Button variant="danger" loading={remove.isPending} onClick={submit}>
          {t('profile.baja.confirm')}
        </Button>
      </>
    );
  } else if (deleted) {
    title = t('profile.baja.doneDeletedTitle', vars);
    body = <p className="type-body-md">{t('profile.baja.doneDeletedBody')}</p>;
    footer = <Button onClick={close}>{t('profile.baja.ok')}</Button>;
  } else {
    title = t('profile.baja.doneTitle', {
      ...vars,
      reason: reason ? t(`profile.baja.reasons.${reason}`).toLowerCase() : '',
    });
    body = <p className="type-body-md">{t('profile.baja.finance')}</p>;
    footer = (
      <>
        <Button variant="outline" onClick={close}>
          {t('profile.baja.notNow')}
        </Button>
        {/* No finance module yet: the waitlist is a WhatsApp message, like the fake doors. */}
        <a
          href={links.feature(t('profile.baja.financeFeature'))}
          target="_blank"
          rel="noopener noreferrer"
          onClick={close}
          className={cx(
            'inline-flex h-control-md items-center justify-center rounded-moon-i-xs bg-primary px-4 text-button-text type-label-md hover:bg-primary-dark',
            focusRing,
          )}
        >
          {t('profile.baja.waitlist')}
        </a>
      </>
    );
  }

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
      }}
      title={title}
      description={step === 'reason' ? t('profile.baja.title') : undefined}
      footer={footer}
    >
      {body}
    </Modal>
  );
}
