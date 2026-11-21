import { differenceInCalendarDays, differenceInMonths, parseISO } from 'date-fns';

import type { Animal } from './api';

/** Days since calving while she milks (the API's projection counts the same way). */
export function daysInMilk(animal: Animal, today: Date): number | null {
  if (animal.lactation_state !== 'LACTANDO' || !animal.last_calving_date) return null;
  return differenceInCalendarDays(today, parseISO(animal.last_calving_date));
}

export function ageInMonths(animal: Animal, today: Date): number {
  return differenceInMonths(today, parseISO(animal.birth_date));
}
