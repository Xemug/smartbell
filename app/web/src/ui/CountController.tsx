import { useTranslation } from 'react-i18next';

import { cx } from './cx';
import { iconMinus, iconPlus } from './icons/glyphs';
import { IconButton } from './IconButton';

type CountSize = 'xs' | 'sm' | 'md' | 'lg';

interface CountControllerProps {
  /** Names the group, e.g. "Crías". */
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  size?: CountSize;
  disabled?: boolean;
  className?: string;
}

const buttonSizes = { xs: 'xs', sm: 'sm', md: 'md', lg: 'lg' } as const;
const text: Record<CountSize, string> = {
  xs: 'type-body-sm',
  sm: 'type-body-md',
  md: 'type-body-lg',
  lg: 'type-title-md',
};

// The kit's −/value/+ control.
export function CountController({
  label,
  value,
  onChange,
  min = 0,
  max = Number.POSITIVE_INFINITY,
  step = 1,
  size = 'md',
  disabled,
  className,
}: CountControllerProps) {
  const { t } = useTranslation();
  const change = (next: number) => onChange(Math.min(max, Math.max(min, next)));
  return (
    <div
      role="group"
      aria-label={label}
      className={cx('inline-flex items-center gap-2', className)}
    >
      <IconButton
        icon={iconMinus}
        label={t('ui.decrease', { label })}
        variant="outline"
        size={buttonSizes[size]}
        disabled={disabled || value <= min}
        onClick={() => change(value - step)}
      />
      <output aria-live="polite" className={cx('min-w-6 text-center tabular-nums', text[size])}>
        {value}
      </output>
      <IconButton
        icon={iconPlus}
        label={t('ui.increase', { label })}
        variant="outline"
        size={buttonSizes[size]}
        disabled={disabled || value >= max}
        onClick={() => change(value + step)}
      />
    </div>
  );
}
