import { forwardRef, type ComponentPropsWithoutRef } from 'react';

import { cx, focusRing } from './cx';
import type { Glyph } from './icons/glyphs';
import { Icon } from './icons/Icon';

type ChipProps = Omit<ComponentPropsWithoutRef<'button'>, 'onChange'> & {
  selected?: boolean;
  size?: 'sm' | 'md';
  icon?: Glyph;
};

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  { selected = false, size = 'md', icon, className, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      {...props}
      aria-pressed={selected}
      className={cx(
        'inline-flex shrink-0 items-center gap-2 rounded-moon-i-sm border px-3 transition-colors',
        size === 'sm' ? 'h-8 type-label-sm' : 'h-10 type-label-md',
        selected
          ? 'border-primary bg-primary-10 text-primary-dark'
          : 'border-transparent bg-neutral-1 text-primary-text hover:bg-secondary-background',
        'disabled:cursor-not-allowed disabled:border-transparent disabled:bg-secondary-background disabled:text-secondary-text',
        focusRing,
        className,
      )}
    >
      {icon && <Icon icon={icon} size={size === 'sm' ? 16 : 20} />}
      {children}
    </button>
  );
});
