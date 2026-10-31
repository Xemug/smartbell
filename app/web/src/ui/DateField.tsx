import * as Popover from '@radix-ui/react-popover';
import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEventHandler,
} from 'react';
import { useTranslation } from 'react-i18next';

import { Calendar } from './Calendar';
import { cx, focusRing } from './cx';
import { fromIso, maskDate, parseDisplay, resolveDate, toDisplay, toIso, todayIso } from './dates';
import { Field, type FieldProps } from './Field';
import { iconCalendar } from './icons/glyphs';
import { Icon } from './icons/Icon';
import { fieldBox, inputSizes, type InputSize } from './inputStyles';

type DateFieldProps = FieldProps & {
  /** ISO day, or empty. Left undefined, the field runs itself and starts on today. */
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  /** ISO day or `today`; later dates are rejected, typed or picked. */
  maxDate?: string;
  minDate?: string;
  name?: string;
  size?: InputSize;
  disabled?: boolean;
  className?: string;
};

export const DateField = forwardRef<HTMLInputElement, DateFieldProps>(function DateField(
  {
    value,
    onChange,
    onBlur,
    maxDate,
    minDate,
    name,
    size = 'md',
    disabled,
    label,
    hint,
    error,
    required,
    className,
  },
  ref,
) {
  const { t } = useTranslation();
  const maxIso = resolveDate(maxDate);
  const minIso = resolveDate(minDate);
  // Today, unless the limits exclude it.
  const [own, setOwn] = useState(() => {
    const today = todayIso();
    return (maxIso && today > maxIso) || (minIso && today < minIso) ? '' : today;
  });
  const [open, setOpen] = useState(false);
  // Text the user is typing. While set it wins over the value, which holds no partial date.
  const [draft, setDraft] = useState<string | null>(null);
  const [rejection, setRejection] = useState<string>();
  const current = value ?? own;

  // A form with no default for this field must hold the date on screen.
  useEffect(() => {
    if (value === undefined && own) onChange?.(own);
    // Once, on mount: afterwards the field reports its own changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Typed text gives way when the parent loads a value this field did not emit, as reset() does.
  const emitted = useRef(value);
  if (value !== emitted.current) {
    emitted.current = value;
    if (draft !== null) setDraft(null);
    if (rejection) setRejection(undefined);
  }

  const commit = (iso: string) => {
    setOwn(iso);
    if (value !== undefined) emitted.current = iso;
    if (iso !== current) onChange?.(iso);
  };

  // A rejected date also empties the value, so submitting cannot save the previous date unseen.
  const check = (text: string): string | undefined => {
    const iso = parseDisplay(text);
    if (!iso) return t('ui.dateInvalid');
    if (maxIso && iso > maxIso)
      return maxIso === todayIso()
        ? t('ui.dateFuture')
        : t('ui.dateAfter', { date: toDisplay(maxIso) });
    if (minIso && iso < minIso) return t('ui.dateBefore', { date: toDisplay(minIso) });
    return undefined;
  };

  const type = (event: ChangeEvent<HTMLInputElement>) => {
    const text = maskDate(event.target.value);
    setDraft(text);
    const complete = text.length === 10;
    const problem = complete ? check(text) : undefined;
    setRejection(problem);
    if (complete && !problem) {
      commit(parseDisplay(text) as string);
      setDraft(null);
    } else commit('');
  };

  const leave: FocusEventHandler<HTMLInputElement> = (event) => {
    if (draft === '') setDraft(null);
    else if (draft !== null) setRejection(check(draft));
    onBlur?.(event);
  };

  const pick = (date: Date | undefined) => {
    if (date) commit(toIso(date));
    setDraft(null);
    setRejection(undefined);
    setOpen(false);
  };

  const shown = draft ?? (current ? toDisplay(current) : '');
  return (
    <Field
      label={label}
      hint={hint}
      error={rejection ?? error}
      required={required}
      className={className}
    >
      {(slot) => (
        <Popover.Root open={open} onOpenChange={setOpen}>
          <Popover.Anchor asChild>
            <div className={cx(fieldBox(Boolean(rejection ?? error), disabled), inputSizes[size])}>
              <input
                ref={ref}
                {...slot}
                name={name}
                value={shown}
                onChange={type}
                onBlur={leave}
                disabled={disabled}
                required={required}
                inputMode="numeric"
                autoComplete="off"
                placeholder={t('ui.datePlaceholder')}
                className="w-full min-w-0 bg-transparent outline-none placeholder:text-secondary-text disabled:cursor-not-allowed"
              />
              <Popover.Trigger
                disabled={disabled}
                aria-label={t('ui.openCalendar')}
                className={cx(
                  'shrink-0 rounded-moon-i-xs text-primary disabled:text-secondary-text',
                  focusRing,
                )}
              >
                <Icon icon={iconCalendar} size={20} />
              </Popover.Trigger>
            </div>
          </Popover.Anchor>
          <Popover.Portal>
            <Popover.Content
              aria-label={t('ui.calendar')}
              align="end"
              sideOffset={4}
              collisionPadding={8}
              className="z-50 rounded-moon-s-sm bg-neutral-1 text-primary-text shadow-moon-md"
            >
              <Calendar
                mode="single"
                autoFocus
                selected={current ? fromIso(current) : undefined}
                defaultMonth={current ? fromIso(current) : undefined}
                onSelect={pick}
                minIso={minIso}
                maxIso={maxIso}
              />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      )}
    </Field>
  );
});
