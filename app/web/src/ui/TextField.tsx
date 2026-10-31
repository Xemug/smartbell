import { forwardRef, useState, type ComponentPropsWithoutRef } from 'react';
import { useTranslation } from 'react-i18next';

import { cx, focusRing } from './cx';
import { Field, type FieldProps } from './Field';
import type { Glyph } from './icons/glyphs';
import { iconEye, iconEyeOff, iconSearch } from './icons/glyphs';
import { Icon } from './icons/Icon';
import { fieldBox, inputSizes, type InputSize } from './inputStyles';

export type TextFieldProps = Omit<ComponentPropsWithoutRef<'input'>, 'size' | 'type'> &
  FieldProps & {
    type?: 'text' | 'password' | 'search' | 'email' | 'tel';
    size?: InputSize;
    leadingIcon?: Glyph;
    trailingIcon?: Glyph;
    /** Draws the label inside the box; it floats up once the field has focus or a value. */
    floatingLabel?: boolean;
  };

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  {
    label,
    hint,
    error,
    required,
    type = 'text',
    size = 'md',
    leadingIcon,
    trailingIcon,
    floatingLabel = false,
    disabled,
    className,
    placeholder,
    ...props
  },
  ref,
) {
  const { t } = useTranslation();
  const [revealed, setRevealed] = useState(false);
  const leading = leadingIcon ?? (type === 'search' ? iconSearch : undefined);
  const floating = floatingLabel && Boolean(label);
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={required}
      hideLabel={floating}
      className={className}
    >
      {(slot, labelId) => (
        <div
          className={cx(
            fieldBox(Boolean(error), disabled),
            inputSizes[floating && size !== 'xl' ? 'lg' : size],
          )}
        >
          {leading && <Icon icon={leading} size={20} className="shrink-0 text-secondary-text" />}
          <div className="relative flex min-w-0 flex-1 self-stretch">
            <input
              ref={ref}
              {...props}
              {...slot}
              type={type === 'password' && revealed ? 'text' : type}
              disabled={disabled}
              required={required}
              // A blank placeholder is what lets CSS see that a floating field is empty.
              placeholder={floating ? ' ' : placeholder}
              className={cx(
                'peer w-full min-w-0 bg-transparent outline-none placeholder:text-secondary-text disabled:cursor-not-allowed',
                floating && 'pt-4',
              )}
            />
            {floating && (
              <label
                id={labelId}
                htmlFor={slot.id}
                className={cx(
                  'pointer-events-none absolute left-0 top-1 text-secondary-text transition-all type-body-sm',
                  'peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:type-body-lg',
                  'peer-focus:top-1 peer-focus:translate-y-0 peer-focus:type-body-sm',
                )}
              >
                {label}
              </label>
            )}
          </div>
          {type === 'password' ? (
            <button
              type="button"
              disabled={disabled}
              onClick={() => setRevealed((r) => !r)}
              aria-label={t(revealed ? 'ui.hidePassword' : 'ui.showPassword')}
              aria-pressed={revealed}
              className={cx('shrink-0 rounded-moon-i-xs text-secondary-text', focusRing)}
            >
              <Icon icon={revealed ? iconEyeOff : iconEye} size={20} />
            </button>
          ) : (
            trailingIcon && (
              <Icon icon={trailingIcon} size={20} className="shrink-0 text-secondary-text" />
            )
          )}
        </div>
      )}
    </Field>
  );
});
