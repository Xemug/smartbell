import { format, isValid, parse, parseISO } from 'date-fns';

// Dates travel as ISO days (2026-10-31), never as Date objects, so a form value cannot shift a
// day across time zones on its way to the API.
const isoFormat = 'yyyy-MM-dd';
const displayFormat = 'dd/MM/yyyy';

export const toIso = (date: Date): string => format(date, isoFormat);
export const todayIso = (): string => toIso(new Date());
export const fromIso = (iso: string): Date => parseISO(iso);
export const toDisplay = (iso: string): string => format(fromIso(iso), displayFormat);

export function parseDisplay(text: string): string | null {
  // date-fns accepts a one-digit day; the mask always produces the full width.
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(text)) return null;
  const date = parse(text, displayFormat, new Date());
  return isValid(date) ? toIso(date) : null;
}

// Adds the slashes as digits are typed: 31102026 becomes 31/10/2026.
export function maskDate(text: string): string {
  const digits = text.replace(/\D/g, '').slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)].filter(Boolean).join('/');
}

export const resolveDate = (date: string | undefined): string | undefined =>
  date === 'today' ? todayIso() : date;
