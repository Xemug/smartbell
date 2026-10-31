import * as Popover from '@radix-ui/react-popover';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from './Button';
import { Calendar, type DateRange } from './Calendar';
import { cx } from './cx';
import { fromIso, resolveDate, toDisplay, toIso } from './dates';
import { Field, type FieldProps } from './Field';
import { iconCalendar } from './icons/glyphs';
import { Icon } from './icons/Icon';
import { fieldBox, inputSizes, type InputSize } from './inputStyles';

export interface IsoRange {
  from: string;
  to: string;
}

type DateRangeFieldProps = FieldProps & {
  value: IsoRange | null;
  onChange: (value: IsoRange | null) => void;
  maxDate?: string;
  minDate?: string;
  size?: InputSize;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
};

// The log filters' range pill. The kit has no range calendar, so this follows the old library's
// Calendar_TwoDates: picking both ends applies, Borrar clears, Cancelar leaves the range alone.
export function DateRangeField({
  value,
  onChange,
  maxDate,
  minDate,
  size = 'md',
  disabled,
  placeholder,
  label,
  hint,
  error,
  required,
  className,
}: DateRangeFieldProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | undefined>();
  const toRange = (range: IsoRange | null): DateRange | undefined =>
    range ? { from: fromIso(range.from), to: fromIso(range.to) } : undefined;

  const openChange = (next: boolean) => {
    if (next) setDraft(toRange(value));
    setOpen(next);
  };
  // The first click starts a range, even over an existing one; the second finishes it.
  const pick = (_range: DateRange | undefined, day: Date) => {
    const start = draft?.to ? undefined : draft?.from;
    if (!start) return setDraft({ from: day, to: undefined });
    const [from, to] = start <= day ? [start, day] : [day, start];
    onChange({ from: toIso(from), to: toIso(to) });
    setOpen(false);
  };
  const clear = () => {
    onChange(null);
    setOpen(false);
  };

  return (
    <Field label={label} hint={hint} error={error} required={required} className={className}>
      {(slot, labelId) => (
        <Popover.Root open={open} onOpenChange={openChange}>
          <Popover.Trigger
            {...slot}
            disabled={disabled}
            aria-labelledby={labelId ? `${labelId} ${slot.id}` : undefined}
            className={cx(
              fieldBox(Boolean(error), disabled),
              inputSizes[size],
              'justify-between text-left outline-none focus-visible:ring-2 focus-visible:ring-primary',
            )}
          >
            <span className={value ? undefined : 'text-secondary-text'}>
              {value
                ? `${toDisplay(value.from)} – ${toDisplay(value.to)}`
                : (placeholder ?? t('ui.rangePlaceholder'))}
            </span>
            <Icon icon={iconCalendar} size={20} className="shrink-0 text-primary" />
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              aria-label={t('ui.calendar')}
              align="start"
              sideOffset={4}
              collisionPadding={8}
              className="z-50 rounded-moon-s-sm bg-neutral-1 text-primary-text shadow-moon-md"
            >
              <Calendar
                mode="range"
                autoFocus
                selected={draft}
                defaultMonth={draft?.from}
                onSelect={pick}
                minIso={resolveDate(minDate)}
                maxIso={resolveDate(maxDate)}
              />
              <div className="flex justify-end gap-2 px-3 pb-3">
                <Button variant="ghost" size="sm" onClick={clear}>
                  {t('ui.clear')}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  {t('ui.cancel')}
                </Button>
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      )}
    </Field>
  );
}
