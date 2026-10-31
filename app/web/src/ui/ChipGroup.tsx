import { cx } from './cx';
import { Chip } from './Chip';
import type { Glyph } from './icons/glyphs';

export interface ChipOption {
  value: string;
  label: string;
  icon?: Glyph;
  count?: number;
  disabled?: boolean;
}

interface ChipGroupProps {
  /** Names the group for screen readers. */
  label: string;
  options: ChipOption[];
  value: string[];
  onChange: (value: string[]) => void;
  size?: 'sm' | 'md';
  layout?: 'row' | 'wrap';
  className?: string;
}

// The kit's Choice Chips: a multi-select filter row.
export function ChipGroup({
  label,
  options,
  value,
  onChange,
  size = 'md',
  layout = 'wrap',
  className,
}: ChipGroupProps) {
  const toggle = (chip: string) =>
    onChange(value.includes(chip) ? value.filter((v) => v !== chip) : [...value, chip]);
  return (
    <div
      role="group"
      aria-label={label}
      className={cx('flex gap-2', layout === 'wrap' ? 'flex-wrap' : 'overflow-x-auto', className)}
    >
      {options.map((option) => (
        <Chip
          key={option.value}
          size={size}
          icon={option.icon}
          count={option.count}
          disabled={option.disabled}
          selected={value.includes(option.value)}
          onClick={() => toggle(option.value)}
        >
          {option.label}
        </Chip>
      ))}
    </div>
  );
}
