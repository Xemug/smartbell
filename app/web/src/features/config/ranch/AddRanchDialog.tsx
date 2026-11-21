import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { useSupportLinks } from '../../../app/support';
import { Button } from '../../../ui/Button';
import { cx, focusRing } from '../../../ui/cx';
import { Modal } from '../../../ui/Modal';
import { TextField } from '../../../ui/TextField';
import { useSnackbar } from '../../../ui/useSnackbar';
import { ApiError, createRanch } from '../api';

/** Agregar Rancho (W 974:41621): a name now; the rest is edited on its Datos Rancho. */
export function AddRanchDialog({
  open,
  onOpenChange,
  onCreated,
  onUpsell,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (id: string) => Promise<void>;
  /** The API said Pro is needed after all (the account changed in another tab). */
  onUpsell: () => void;
}) {
  const { t } = useTranslation();
  const snackbar = useSnackbar();
  const [name, setName] = useState('');
  const [touched, setTouched] = useState(false);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const blank = name.trim() === '';

  const close = (next: boolean) => {
    if (saving) return;
    if (!next) {
      setName('');
      setTouched(false);
      setFailed(false);
    }
    onOpenChange(next);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (blank) return;
    setSaving(true);
    setFailed(false);
    let created: { id: string; name: string };
    try {
      created = await createRanch(name.trim());
    } catch (error) {
      setSaving(false);
      if (error instanceof ApiError && error.code === 'pro_required') {
        close(false);
        onUpsell();
        return;
      }
      setFailed(true);
      return;
    }
    snackbar.show({ kind: 'success', message: t('config.ranch.added', { name: created.name }) });
    setSaving(false);
    close(false);
    await onCreated(created.id);
  };

  return (
    <Modal open={open} onOpenChange={close} title={t('config.ranch.addTitle')}>
      <form onSubmit={(event) => void submit(event)} noValidate className="flex flex-col gap-4">
        <TextField
          label={t('config.ranch.name')}
          placeholder={t('config.ranch.namePlaceholder')}
          value={name}
          maxLength={120}
          required
          onChange={(event) => setName(event.target.value)}
          error={touched && blank ? t('config.ranch.nameRequired') : undefined}
        />
        {failed && (
          <p role="alert" className="text-error type-body-sm">
            {t('config.ranch.addError')}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => close(false)}>
            {t('ui.cancel')}
          </Button>
          <Button type="submit" loading={saving}>
            {t('config.ranch.addSubmit')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/**
 * A second owned ranch is a Pro feature (plans-billing). There is no purchase flow yet, so See
 * Plans opens the sales chat with the membership message.
 */
export function UpsellDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const links = useSupportLinks();
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={t('config.ranch.upsellTitle')}
      description={t('config.ranch.upsellBody')}
    >
      <a
        href={links.payment}
        target="_blank"
        rel="noopener noreferrer"
        className={cx(
          'flex h-control-lg items-center justify-center gap-2 rounded-moon-i-xs bg-primary px-5 text-button-text type-label-lg',
          focusRing,
        )}
      >
        {t('config.ranch.upsellCta')}
      </a>
    </Modal>
  );
}
