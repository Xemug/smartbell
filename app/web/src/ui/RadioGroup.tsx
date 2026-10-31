import * as RadixRadio from '@radix-ui/react-radio-group';
import { forwardRef, useId, type FocusEventHandler } from 'react';

import { cx, focusRing } from './cx';
import { Field, type FieldProps } from './Field';
import type { Glyph } from './icons/glyphs';
import { Icon } from './icons/Icon';

export interface RadioOption {
  value: string;
  label: string;
  /** Second line, for the two-line option cards. */
  description?: string;
  icon?: Glyph;
  disabled?: boolean;
}

type RadioGroupProps = FieldProps & {
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: FocusEventHandler<HTMLDivElement>;
  name?: string;
  disabled?: boolean;
  /** `card` is the option card from Boton Text and the Vaca / Vaquilla / Toro selector. */
  variant?: 'plain' | 'card';
  orientation?: 'vertical' | 'horizontal';
  /** Which side of the label the dot sits on. */
  buttonPosition?: 'left' | 'right';
  className?: string;
};

function Radio({
  option,
  disabled,
  variant,
  buttonPosition,
  invalid,
}: {
  option: RadioOption;
  disabled: boolean | undefined;
  variant: 'plain' | 'card';
  buttonPosition: 'left' | 'right';
  invalid: boolean;
}) {
  const id = useId();
  const off = disabled || option.disabled;
  const card = variant === 'card';
  return (
    <label
      htmlFor={id}
      className={cx(
        'flex items-center gap-2',
        buttonPosition === 'right' && 'flex-row-reverse justify-between',
        off ? 'cursor-not-allowed text-secondary-text' : 'cursor-pointer',
        card &&
          'rounded-moon-i-sm border border-neutral-2 bg-neutral-1 p-3 transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary-10',
        card && off && 'bg-secondary-background',
        card && !off && 'hover:border-neutral-3',
      )}
    >
      <RadixRadio.Item
        id={id}
        value={option.value}
        disabled={off}
        className={cx(
          'flex size-6 shrink-0 items-center justify-center rounded-full border-2 bg-neutral-1',
          invalid ? 'border-error' : 'border-neutral-3',
          'data-[state=checked]:border-primary disabled:!border-neutral-2 disabled:bg-neutral-2',
          focusRing,
        )}
      >
        <RadixRadio.Indicator className="size-3 rounded-full bg-primary data-[disabled]:bg-secondary-text" />
      </RadixRadio.Item>
      {option.icon && <Icon icon={option.icon} size={24} />}
      <span className="flex min-w-0 flex-col">
        <span className={card ? 'type-label-lg' : 'type-body-lg'}>{option.label}</span>
        {option.description && (
          <span className="type-body-sm text-secondary-text">{option.description}</span>
        )}
      </span>
    </label>
  );
}

export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(function RadioGroup(
  {
    options,
    value,
    onChange,
    onBlur,
    name,
    disabled,
    variant = 'plain',
    orientation = 'vertical',
    buttonPosition = 'left',
    label,
    hint,
    error,
    required,
    className,
  },
  ref,
) {
  return (
    <Field label={label} hint={hint} error={error} required={required} group className={className}>
      {(slot, labelId) => (
        <RadixRadio.Root
          ref={ref}
          {...slot}
          aria-labelledby={labelId}
          value={value}
          onValueChange={onChange}
          onBlur={onBlur}
          name={name}
          disabled={disabled}
          required={required}
          orientation={orientation}
          className={cx('flex gap-2', orientation === 'vertical' ? 'flex-col' : 'flex-wrap')}
        >
          {options.map((option) => (
            <Radio
              key={option.value}
              option={option}
              disabled={disabled}
              variant={variant}
              buttonPosition={buttonPosition}
              invalid={Boolean(error)}
            />
          ))}
        </RadixRadio.Root>
      )}
    </Field>
  );
});
