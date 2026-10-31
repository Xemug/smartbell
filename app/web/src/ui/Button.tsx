import { forwardRef, type ComponentPropsWithoutRef } from 'react';

import { buttonClass, iconSizes, type ButtonSize, type ButtonVariant } from './buttonStyles';
import { cx } from './cx';
import type { Glyph } from './icons/glyphs';
import { Icon } from './icons/Icon';
import { Spinner } from './Spinner';

type ButtonProps = ComponentPropsWithoutRef<'button'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: Glyph;
  trailingIcon?: Glyph;
  /** Blocks the button and swaps the leading icon for a spinner while work is in flight. */
  loading?: boolean;
  fullWidth?: boolean;
};

const sizes: Record<ButtonSize, string> = {
  xs: 'h-control-xs gap-1 px-2 type-label-sm',
  sm: 'h-control-sm gap-1 px-3 type-label-sm',
  md: 'h-control-md gap-2 px-4 type-label-md',
  lg: 'h-control-lg gap-2 px-5 type-label-lg',
  xl: 'h-control-xl gap-2 px-6 type-label-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'fill',
    size = 'md',
    leadingIcon,
    trailingIcon,
    loading = false,
    fullWidth = false,
    disabled,
    className,
    children,
    ...props
  },
  ref,
) {
  const iconSize = iconSizes[size];
  return (
    <button
      ref={ref}
      type="button"
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(buttonClass(variant), sizes[size], fullWidth && 'w-full', className)}
    >
      {loading ? (
        <Spinner size={iconSize} />
      ) : (
        leadingIcon && <Icon icon={leadingIcon} size={iconSize} />
      )}
      {children}
      {trailingIcon && <Icon icon={trailingIcon} size={iconSize} />}
    </button>
  );
});
