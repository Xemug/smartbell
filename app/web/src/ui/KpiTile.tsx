import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { cx, focusRing } from './cx';
import type { Glyph } from './icons/glyphs';
import { Icon } from './icons/Icon';

type KpiTone = 'primary' | 'error' | 'success' | 'info';

interface KpiTileProps {
  label: string;
  /** A disc icon. */
  icon: Glyph;
  tone?: KpiTone;
  /** The stat tile's one number, as text so padding such as `003` survives. */
  value?: string;
  /** The split tile's "NN label" rows, drawn beside the coloured caption. */
  rows?: { value: string; label: string }[];
  /** Opens the drill-down; the whole tile becomes the button. */
  onClick?: () => void;
  className?: string;
}

const tones: Record<KpiTone, string> = {
  primary: 'bg-primary text-button-text',
  error: 'bg-error text-button-text',
  // Figma's white on these two is under AA.
  success: 'bg-alternate text-primary-text',
  info: 'bg-tertiary text-primary-dark',
};

function Frame({
  onClick,
  className,
  children,
}: Pick<KpiTileProps, 'onClick' | 'className'> & { children: ReactNode }) {
  const box = cx(
    'flex overflow-hidden rounded-moon-i-sm bg-neutral-1 text-left text-primary-text shadow-moon-sm',
    className,
  );
  return onClick ? (
    <button type="button" onClick={onClick} className={cx(box, focusRing, 'hover:shadow-moon-md')}>
      {children}
    </button>
  ) : (
    <div className={box}>{children}</div>
  );
}

// Generic-card: KpiStatCard with `value` (header strip, disc, count), KpiSplitCard with `rows`.
export function KpiTile({
  label,
  icon,
  tone = 'primary',
  value,
  rows,
  onClick,
  className,
}: KpiTileProps) {
  const { t } = useTranslation();

  if (rows) {
    return (
      <Frame onClick={onClick} className={className}>
        <span
          className={cx(
            'flex w-28 shrink-0 flex-col items-center justify-center gap-1 p-3 text-center type-label-sm',
            tones[tone],
          )}
        >
          <Icon icon={icon} size={48} />
          {label}
        </span>
        <span className="flex min-w-0 flex-1 flex-col justify-center gap-2 p-3">
          {rows.map((row) => (
            <span key={row.label} className="flex items-baseline gap-2">
              <span className="ramp-kpi">{row.value}</span>
              <span className="type-body-sm text-secondary-text">{row.label}</span>
            </span>
          ))}
        </span>
      </Frame>
    );
  }

  return (
    <Frame onClick={onClick} className={cx('flex-col', className)}>
      <span className={cx('px-3 py-2 text-center type-label-md', tones[tone])}>{label}</span>
      <span className="flex items-center justify-center gap-3 p-3">
        <Icon icon={icon} size={48} />
        <span className="ramp-kpi">{value}</span>
      </span>
      {onClick && (
        <span className="pb-2 text-center type-label-sm text-primary">{t('ui.seeMore')}</span>
      )}
    </Frame>
  );
}
