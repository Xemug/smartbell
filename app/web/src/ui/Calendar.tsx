import { DayPicker, type DateRange, type DayPickerProps } from 'react-day-picker';
import { enUS, es } from 'react-day-picker/locale';
import { useTranslation } from 'react-i18next';

import { cx, focusRing } from './cx';
import { fromIso } from './dates';

export type { DateRange };

type CalendarProps = DayPickerProps & {
  /** ISO days; dates outside them cannot be picked or navigated to. */
  minIso?: string;
  maxIso?: string;
};

const classNames = {
  root: 'relative w-fit p-3',
  months: 'flex',
  nav: 'absolute inset-x-3 top-3 flex h-10 items-center justify-between',
  button_previous: cx(
    'relative z-10 flex size-10 items-center justify-center rounded-full text-primary hover:bg-primary-10 disabled:text-neutral-2',
    focusRing,
  ),
  button_next: cx(
    'relative z-10 flex size-10 items-center justify-center rounded-full text-primary hover:bg-primary-10 disabled:text-neutral-2',
    focusRing,
  ),
  chevron: 'size-5 fill-current',
  month_caption: 'flex h-10 items-center justify-center',
  caption_label: 'ramp-card-title capitalize',
  weekday: 'size-11 type-label-sm font-normal capitalize text-secondary-text',
  day: 'size-11 p-0.5 text-center type-body-md',
  day_button: cx(
    'size-10 rounded-full hover:bg-primary-10 disabled:cursor-not-allowed disabled:hover:bg-transparent',
    focusRing,
  ),
  selected: '[&>button]:bg-primary [&>button]:text-button-text [&>button]:hover:bg-primary',
  range_start: '',
  range_end: '',
  range_middle:
    'bg-primary-10 [&>button]:!bg-transparent [&>button]:!text-primary-text [&>button]:hover:!bg-primary-10',
  today: 'font-semibold text-primary',
  outside: 'text-secondary-text',
  disabled: 'text-neutral-3',
  hidden: 'invisible',
};

// Monday first, as the kit draws it. react-day-picker owns the grid keyboard model.
export function Calendar({ minIso, maxIso, ...props }: CalendarProps) {
  const { i18n } = useTranslation();
  const min = minIso ? fromIso(minIso) : undefined;
  const max = maxIso ? fromIso(maxIso) : undefined;
  const disabled = [...(min ? [{ before: min }] : []), ...(max ? [{ after: max }] : [])];
  return (
    <DayPicker
      {...props}
      locale={i18n.language.startsWith('es') ? es : enUS}
      weekStartsOn={1}
      showOutsideDays
      disabled={disabled}
      startMonth={min}
      endMonth={max}
      classNames={classNames}
    />
  );
}
