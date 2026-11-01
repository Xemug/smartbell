import { useTranslation } from 'react-i18next';

import { Modal } from '../ui/Modal';
import { cx, focusRing } from '../ui/cx';
import { iconMessage } from '../ui/icons/glyphs';
import { Icon } from '../ui/icons/Icon';
import type { NavId } from './navigation';
import { whatsappUrl } from './whatsapp';

interface FakeDoorModalProps {
  /** The tab that was tapped; null keeps the modal closed. */
  feature: NavId | null;
  onClose: () => void;
}

export function FakeDoorModal({ feature, onClose }: FakeDoorModalProps) {
  const { t } = useTranslation();
  const message = feature ? t('fakeDoor.prefill', { nombre: t(`nav.${feature}`) }) : '';
  return (
    <Modal
      open={feature !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t('fakeDoor.title')}
      description={t('fakeDoor.body')}
    >
      {/* Dark text: white on the kit's green, as drawn, fails contrast. */}
      <a
        href={whatsappUrl(message)}
        target="_blank"
        rel="noopener noreferrer"
        className={cx(
          'flex h-control-lg items-center justify-center gap-2 rounded-moon-i-xs bg-alternate px-5 text-primary-text type-label-lg',
          focusRing,
        )}
      >
        <Icon icon={iconMessage} size={24} />
        {t('fakeDoor.cta')}
      </a>
    </Modal>
  );
}
