import * as RadixSelect from '@radix-ui/react-select';
import { forwardRef, type FocusEventHandler } from 'react';

import { cx } from './cx';
import { Field, type FieldProps } from './Field';
import { iconCheck, iconChevronDown } from './icons/glyphs';
import { Icon } from './icons/Icon';
import { fieldBox, inputSizes, type InputSize } from './inputStyles';

export interface SelectOption {
  value: string;
  label: string;
  /** Shorter text for the closed control, e.g. just the dial code. */
  selectedLabel?: string;
  disabled?: boolean;
}

type SelectProps = FieldProps & {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: FocusEventHandler<HTMLButtonElement>;
  name?: string;
  placeholder?: string;
  size?: InputSize;
  disabled?: boolean;
  className?: string;
  /** Names the control when no visible label is given. */
  'aria-label'?: string;
};

export const Select = forwardRef<HTMLButtonElement, SelectProps>(function Select(
  {
    options,
    value,
    onChange,
    onBlur,
    name,
    placeholder,
    size = 'md',
    disabled,
    label,
    hint,
    error,
    required,
    className,
    'aria-label': ariaLabel,
  },
  ref,
) {
  const selected = options.find((o) => o.value === value);
  return (
    <Field label={label} hint={hint} error={error} required={required} className={className}>
      {(slot, labelId) => (
        <RadixSelect.Root
          value={value ?? ''}
          onValueChange={onChange}
          name={name}
          disabled={disabled}
          required={required}
        >
          <RadixSelect.Trigger
            ref={ref}
            {...slot}
            onBlur={onBlur}
            aria-label={ariaLabel}
            aria-labelledby={labelId}
            className={cx(
              fieldBox(Boolean(error), disabled),
              inputSizes[size],
              'justify-between text-left outline-none data-[placeholder]:text-secondary-text',
              'focus-visible:ring-2 focus-visible:ring-primary',
            )}
          >
            <RadixSelect.Value placeholder={placeholder}>
              {selected?.selectedLabel ?? selected?.label}
            </RadixSelect.Value>
            <RadixSelect.Icon>
              <Icon icon={iconChevronDown} size={20} className="text-secondary-text" />
            </RadixSelect.Icon>
          </RadixSelect.Trigger>
          <RadixSelect.Portal>
            <RadixSelect.Content
              position="popper"
              sideOffset={4}
              className="z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-moon-i-sm border border-neutral-2 bg-neutral-1 text-primary-text shadow-moon-md"
            >
              <RadixSelect.Viewport className="p-1">
                {options.map((option) => (
                  <RadixSelect.Item
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    className={cx(
                      'flex cursor-pointer select-none items-center justify-between gap-2 rounded-moon-i-xs px-3 py-2 type-body-lg outline-none',
                      'data-[highlighted]:bg-primary-10 data-[state=checked]:text-primary',
                      'data-[disabled]:cursor-not-allowed data-[disabled]:text-secondary-text',
                    )}
                  >
                    <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                    <RadixSelect.ItemIndicator>
                      <Icon icon={iconCheck} size={20} />
                    </RadixSelect.ItemIndicator>
                  </RadixSelect.Item>
                ))}
              </RadixSelect.Viewport>
            </RadixSelect.Content>
          </RadixSelect.Portal>
        </RadixSelect.Root>
      )}
    </Field>
  );
});
