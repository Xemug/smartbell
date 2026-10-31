import type { ReactNode } from 'react';

import { cx, focusRing } from './cx';
import type { Glyph } from './icons/glyphs';
import { Icon } from './icons/Icon';

interface SplitIndicatorProps {
  /** Shown beside the count; with an icon it becomes the accessible name instead. */
  label: string;
  icon?: Glyph;
  count: number;
  /** The Figma activated / deactivated pair. */
  active?: boolean;
  /** Makes it a toggle, as on the list filters; without it this is a read-only figure. */
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

// The split bar from Boton Vacas en Sistema and the Cow / Calf / Bull counters: what is counted on
// one side, a zero-padded count on the other. White on the frames' light blue fails AA, so the
// halves step down from primary to primary-dark.
export function SplitIndicator({
  label,
  icon,
  count,
  active = true,
  onClick,
  disabled,
  className,
}: SplitIndicatorProps) {
  const shown = String(count).padStart(3, '0');
  // The name repeats the digits on screen, so voice control can target what it sees.
  const name = `${label}: ${shown}`;
  const body: ReactNode = (
    <>
      <span
        className={cx(
          'flex min-w-0 flex-1 items-center justify-center px-3 type-label-md',
          active ? 'bg-primary text-button-text' : 'bg-neutral-2 text-primary-text',
        )}
      >
        {icon ? <Icon icon={icon} size={24} /> : label}
      </span>
      <span
        className={cx(
          'flex items-center px-3 font-display text-base font-semibold tabular-nums text-button-text',
          active ? 'bg-primary-dark' : 'bg-secondary-text',
        )}
      >
        {shown}
      </span>
    </>
  );
  const box = cx('inline-flex h-control-md overflow-hidden rounded-moon-i-xs', className);

  if (!onClick)
    return (
      <div role="group" aria-label={name} className={box}>
        {body}
      </div>
    );
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      aria-label={name}
      className={cx(box, 'disabled:cursor-not-allowed disabled:opacity-50', focusRing)}
    >
      {body}
    </button>
  );
}
