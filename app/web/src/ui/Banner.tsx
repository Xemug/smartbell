import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { cx, focusRing } from './cx';
import {
  iconAlertTriangle,
  iconCheckCircle,
  iconInfoCircle,
  iconXCircle,
  type Glyph,
} from './icons/glyphs';
import { Icon } from './icons/Icon';

type BannerTone = 'error' | 'warning' | 'info' | 'success';

interface BannerProps {
  tone?: BannerTone;
  title?: string;
  children: ReactNode;
  /** Replaces the tone's icon. */
  icon?: Glyph;
  onClose?: () => void;
  className?: string;
}

const tones: Record<BannerTone, { box: string; icon: Glyph }> = {
  // Alert_Message: solid red. The tinted tones keep dark text, since the kit's yellow and blue
  // cannot carry white.
  error: { box: 'bg-error text-button-text', icon: iconAlertTriangle },
  warning: { box: 'bg-warning-10 text-primary-text', icon: iconAlertTriangle },
  info: { box: 'bg-info-10 text-primary-text', icon: iconInfoCircle },
  success: { box: 'bg-success-10 text-primary-text', icon: iconCheckCircle },
};

export function Banner({ tone = 'info', title, children, icon, onClose, className }: BannerProps) {
  const { t } = useTranslation();
  const style = tones[tone];
  return (
    <div
      role={tone === 'error' || tone === 'warning' ? 'alert' : undefined}
      className={cx(
        'flex items-start gap-3 rounded-moon-i-xs px-4 py-3 type-body-md',
        style.box,
        className,
      )}
    >
      <Icon icon={icon ?? style.icon} size={24} className="shrink-0" />
      <div className="min-w-0 flex-1 self-center">
        {title && <p className="type-label-md">{title}</p>}
        <div>{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          aria-label={t('ui.close')}
          onClick={onClose}
          className={cx('shrink-0 rounded-full', focusRing)}
        >
          <Icon icon={iconXCircle} size={24} />
        </button>
      )}
    </div>
  );
}
