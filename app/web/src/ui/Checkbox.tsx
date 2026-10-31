import * as RadixCheckbox from '@radix-ui/react-checkbox';
import { forwardRef, useId, type FocusEventHandler } from 'react';

import { cx, focusRing } from './cx';
import { iconCheck, iconMinus } from './icons/glyphs';
import { Icon } from './icons/Icon';

type CheckboxProps = {
  label?: string;
  value?: boolean;
  onChange?: (checked: boolean) => void;
  onBlur?: FocusEventHandler<HTMLButtonElement>;
  /** A parent whose children are only partly checked. */
  indeterminate?: boolean;
  variant?: 'fill' | 'outline';
  name?: string;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  className?: string;
  'aria-label'?: string;
};

export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(function Checkbox(
  {
    label,
    value,
    onChange,
    onBlur,
    indeterminate = false,
    variant = 'fill',
    name,
    disabled,
    required,
    error,
    className,
    'aria-label': ariaLabel,
  },
  ref,
) {
  const id = useId();
  return (
    <div className={cx('inline-flex items-center gap-2', className)}>
      <RadixCheckbox.Root
        ref={ref}
        id={id}
        name={name}
        checked={indeterminate ? 'indeterminate' : (value ?? false)}
        onCheckedChange={(state) => onChange?.(state === true)}
        onBlur={onBlur}
        disabled={disabled}
        required={required}
        aria-label={ariaLabel}
        aria-invalid={error || undefined}
        className={cx(
          'flex size-6 shrink-0 items-center justify-center rounded-moon-i-xs border bg-neutral-1 transition-colors',
          error ? 'border-error' : 'border-neutral-3',
          variant === 'fill'
            ? 'data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-button-text data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-button-text'
            : 'text-primary data-[state=checked]:border-primary data-[state=indeterminate]:border-primary',
          // Important, or the checked colours above win over the disabled ones.
          'disabled:cursor-not-allowed disabled:!border-neutral-2 disabled:!bg-neutral-2 disabled:!text-secondary-text',
          focusRing,
        )}
      >
        <RadixCheckbox.Indicator>
          <Icon icon={indeterminate ? iconMinus : iconCheck} size={18} />
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
      {label && (
        <label
          htmlFor={id}
          className={cx('type-body-lg', disabled && 'cursor-not-allowed text-secondary-text')}
        >
          {label}
        </label>
      )}
    </div>
  );
});
