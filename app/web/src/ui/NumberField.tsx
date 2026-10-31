import { forwardRef, type ChangeEvent } from 'react';

import { sanitizeNumber } from './sanitize';
import { TextField, type TextFieldProps } from './TextField';

type NumberFieldProps = Omit<TextFieldProps, 'type' | 'value' | 'onChange' | 'inputMode'> & {
  /** Kept as typed, so "12." survives while the user is still entering decimals. */
  value?: string;
  onChange?: (value: string) => void;
  /** Digits allowed after the point; 0 means whole numbers only. */
  decimals?: number;
  unit?: string;
};

export const NumberField = forwardRef<HTMLInputElement, NumberFieldProps>(function NumberField(
  { value, onChange, decimals = 0, unit, hint, ...props },
  ref,
) {
  const change = (event: ChangeEvent<HTMLInputElement>) =>
    onChange?.(sanitizeNumber(event.target.value, decimals));
  return (
    <TextField
      ref={ref}
      {...props}
      hint={hint ?? unit}
      value={value}
      onChange={change}
      inputMode={decimals > 0 ? 'decimal' : 'numeric'}
    />
  );
});
