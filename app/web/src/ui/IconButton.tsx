import { forwardRef, type ComponentPropsWithoutRef } from 'react';

import { buttonClass, iconSizes, type ButtonSize, type ButtonVariant } from './buttonStyles';
import { cx } from './cx';
import type { Glyph } from './icons/glyphs';
import { Icon } from './icons/Icon';
import { Spinner } from './Spinner';

type IconButtonProps = Omit<ComponentPropsWithoutRef<'button'>, 'children' | 'aria-label'> & {
  icon: Glyph;
  /** Accessible name; the button shows no text. */
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  circle?: boolean;
  loading?: boolean;
};

const sizes: Record<ButtonSize, string> = {
  xs: 'size-6',
  sm: 'size-control-sm',
  md: 'size-control-md',
  lg: 'size-control-lg',
  xl: 'size-control-xl',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  {
    icon,
    label,
    variant = 'fill',
    size = 'md',
    circle = false,
    loading = false,
    disabled,
    className,
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      {...props}
      aria-label={label}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cx(buttonClass(variant), sizes[size], circle && 'rounded-full', className)}
    >
      {loading ? <Spinner size={iconSizes[size]} /> : <Icon icon={icon} size={iconSizes[size]} />}
    </button>
  );
});
