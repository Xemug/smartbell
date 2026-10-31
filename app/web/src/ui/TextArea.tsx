import { forwardRef, type ComponentPropsWithoutRef } from 'react';

import { cx } from './cx';
import { Field, type FieldProps } from './Field';
import { fieldBox } from './inputStyles';

type TextAreaProps = ComponentPropsWithoutRef<'textarea'> &
  FieldProps & {
    /** Lets the user drag the box taller. */
    scaling?: boolean;
  };

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, hint, error, required, scaling = false, disabled, className, rows = 4, ...props },
  ref,
) {
  return (
    <Field label={label} hint={hint} error={error} required={required} className={className}>
      {(slot) => (
        <div className={cx(fieldBox(Boolean(error), disabled), 'py-2')}>
          <textarea
            ref={ref}
            {...props}
            {...slot}
            rows={rows}
            disabled={disabled}
            required={required}
            className={cx(
              'w-full bg-transparent outline-none placeholder:text-secondary-text disabled:cursor-not-allowed',
              scaling ? 'resize-y' : 'resize-none',
            )}
          />
        </div>
      )}
    </Field>
  );
});
