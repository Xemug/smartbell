import * as RadixSwitch from '@radix-ui/react-switch';
import { forwardRef, useId, type FocusEventHandler } from 'react';

import { cx, focusRing } from './cx';

type ToggleSize = '2xs' | 'xs' | 'sm';

type ToggleProps = {
  label?: string;
  value?: boolean;
  onChange?: (checked: boolean) => void;
  onBlur?: FocusEventHandler<HTMLButtonElement>;
  size?: ToggleSize;
  /** The kit's custom colours: blue by default, red or green for on/off meanings. */
  tone?: 'primary' | 'error' | 'success';
  name?: string;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
};

const tracks: Record<ToggleSize, string> = {
  '2xs': 'h-4 w-7',
  xs: 'h-6 w-10',
  sm: 'h-8 w-[60px]',
};

const thumbs: Record<ToggleSize, string> = {
  '2xs': 'size-3 data-[state=checked]:translate-x-3',
  xs: 'size-5 data-[state=checked]:translate-x-4',
  sm: 'size-7 data-[state=checked]:translate-x-7',
};

const tones = {
  primary: 'data-[state=checked]:bg-primary',
  error: 'data-[state=checked]:bg-error',
  success: 'data-[state=checked]:bg-success',
};

export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(function Toggle(
  {
    label,
    value,
    onChange,
    onBlur,
    size = 'xs',
    tone = 'primary',
    name,
    disabled,
    className,
    'aria-label': ariaLabel,
  },
  ref,
) {
  const id = useId();
  return (
    <div className={cx('inline-flex items-center gap-2', className)}>
      <RadixSwitch.Root
        ref={ref}
        id={id}
        name={name}
        checked={value}
        onCheckedChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        aria-label={ariaLabel}
        className={cx(
          // The kit's off track is near-invisible; neutral-3 reaches the 3:1 a control needs.
          'relative shrink-0 rounded-full bg-neutral-3 transition-colors',
          'disabled:cursor-not-allowed disabled:opacity-40',
          tracks[size],
          tones[tone],
          focusRing,
        )}
      >
        <RadixSwitch.Thumb
          className={cx(
            'block translate-x-0.5 rounded-full bg-neutral-1 shadow-moon-sm transition-transform',
            thumbs[size],
          )}
        />
      </RadixSwitch.Root>
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
