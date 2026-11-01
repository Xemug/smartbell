import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { cx, focusRing } from './cx';
import { iconXCircle, type Glyph } from './icons/glyphs';
import { Icon } from './icons/Icon';

/** The three cases of event-flows.md §1.11. */
export type SnackbarKind = 'success' | 'deleted' | 'error';

interface SnackbarProps {
  kind?: SnackbarKind;
  message: string;
  /** The event's disc icon. Figma draws none on `deleted` and `error`. */
  icon?: Glyph;
  /** Milliseconds on screen; hovering or focusing it holds the count. Omit to keep it up. */
  duration?: number;
  onClose?: () => void;
  className?: string;
}

// Figma's white on this green is 1.8:1, so the text is dark. White on the red is 4.5:1.
const kinds: Record<SnackbarKind, string> = {
  success: 'bg-alternate text-primary-text',
  deleted: 'bg-error text-button-text',
  error: 'bg-error text-button-text',
};

export function Snackbar({
  kind = 'success',
  message,
  icon,
  duration,
  onClose,
  className,
}: SnackbarProps) {
  const { t } = useTranslation();
  const [held, setHeld] = useState(false);

  useEffect(() => {
    if (held || duration === undefined || !onClose) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [held, duration, onClose]);

  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      onPointerEnter={() => setHeld(true)}
      onPointerLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={() => setHeld(false)}
      className={cx(
        'flex min-h-12 w-fit min-w-[min(312px,100%)] max-w-full items-center gap-3 rounded-moon-i-xs py-1 pl-3 pr-2 shadow-moon-md',
        kinds[kind],
        className,
      )}
    >
      {icon && <Icon icon={icon} size={40} className="shrink-0" />}
      <span className="min-w-0 flex-1 text-center type-label-lg">{message}</span>
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
