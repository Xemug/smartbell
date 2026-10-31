import { forwardRef, useMemo, useState, type FocusEventHandler } from 'react';
import { useTranslation } from 'react-i18next';

import { cx } from './cx';
import { Field, type FieldProps } from './Field';
import { iconPhone } from './icons/glyphs';
import { Icon } from './icons/Icon';
import { fieldBox, inputSizes, type InputSize } from './inputStyles';
import { sanitizePhone } from './sanitize';
import { Select } from './Select';

// Mexico first, then the region and Spain. +1 stands for both the US and Canada.
const dialCodes: { code: string; region: string }[] = [
  { code: '+52', region: 'MX' },
  { code: '+1', region: 'US' },
  { code: '+34', region: 'ES' },
  { code: '+54', region: 'AR' },
  { code: '+591', region: 'BO' },
  { code: '+55', region: 'BR' },
  { code: '+56', region: 'CL' },
  { code: '+57', region: 'CO' },
  { code: '+506', region: 'CR' },
  { code: '+593', region: 'EC' },
  { code: '+503', region: 'SV' },
  { code: '+502', region: 'GT' },
  { code: '+504', region: 'HN' },
  { code: '+505', region: 'NI' },
  { code: '+507', region: 'PA' },
  { code: '+595', region: 'PY' },
  { code: '+51', region: 'PE' },
  { code: '+598', region: 'UY' },
  { code: '+58', region: 'VE' },
];

const defaultDialCode = '+52';

function splitPhone(value: string, fallback: string): { dial: string; local: string } {
  if (!value.startsWith('+')) return { dial: fallback, local: value };
  const match = dialCodes
    .filter(({ code }) => value.startsWith(code))
    .sort((a, b) => b.code.length - a.code.length)[0];
  // Keep an unlisted code in the number itself rather than dropping what was typed.
  return match
    ? { dial: match.code, local: value.slice(match.code.length) }
    : { dial: fallback, local: value };
}

type PhoneFieldProps = FieldProps & {
  /** The full number, e.g. +524421234567; empty until digits are typed. */
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  name?: string;
  size?: InputSize;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
};

export const PhoneField = forwardRef<HTMLInputElement, PhoneFieldProps>(function PhoneField(
  {
    value = '',
    onChange,
    onBlur,
    name,
    size = 'md',
    disabled,
    placeholder,
    label,
    hint,
    error,
    required,
    className,
  },
  ref,
) {
  const { t, i18n } = useTranslation();
  // The code has to survive an empty number, which the value alone cannot hold.
  const [chosenDial, setChosenDial] = useState(defaultDialCode);
  const { dial, local } = splitPhone(value, chosenDial);
  const options = useMemo(() => {
    const regions = new Intl.DisplayNames([i18n.language], { type: 'region' });
    return dialCodes.map(({ code, region }) => ({
      value: code,
      label: `${code} ${regions.of(region)}`,
      selectedLabel: code,
    }));
  }, [i18n.language]);

  const join = (nextDial: string, nextLocal: string) => (nextLocal ? nextDial + nextLocal : '');
  const changeNumber = (text: string) => {
    const clean = sanitizePhone(text);
    if (clean.startsWith('+')) {
      // A pasted international number brings its own code.
      const parts = splitPhone(clean, dial);
      setChosenDial(parts.dial);
      onChange?.(parts.local.startsWith('+') ? clean : join(parts.dial, parts.local));
    } else onChange?.(join(dial, clean));
  };
  const changeDial = (nextDial: string) => {
    setChosenDial(nextDial);
    onChange?.(join(nextDial, local));
  };

  return (
    <Field label={label} hint={hint} error={error} required={required} className={className}>
      {(slot) => (
        <div className="flex gap-2">
          <Select
            aria-label={t('ui.dialCode')}
            options={options}
            value={dial}
            onChange={changeDial}
            size={size}
            disabled={disabled}
            className="w-28 shrink-0"
          />
          <div className={cx(fieldBox(Boolean(error), disabled), inputSizes[size])}>
            <Icon icon={iconPhone} size={20} className="shrink-0 text-secondary-text" />
            <input
              ref={ref}
              {...slot}
              name={name}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={local}
              onChange={(event) => changeNumber(event.target.value)}
              onBlur={onBlur}
              disabled={disabled}
              required={required}
              placeholder={placeholder}
              className="w-full min-w-0 bg-transparent outline-none placeholder:text-secondary-text disabled:cursor-not-allowed"
            />
          </div>
        </div>
      )}
    </Field>
  );
});
