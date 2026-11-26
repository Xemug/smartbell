import { differenceInCalendarDays, differenceInMonths, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

import type { AnimalDetail, AnimalEvent } from './api';

/** The words the copy uses for this animal ("La vaca 00001…"). */
export type Noun = 'vaca' | 'vaquilla' | 'toro' | 'becerro' | 'novillo';
export const nounOf = (animal: Pick<AnimalDetail, 'kind'>): Noun =>
  animal.kind.toLowerCase() as Noun;

/** "entre los días 12 al 18 de septiembre de 2025", or across months and years. */
export function windowText(startIso: string, endIso: string): string {
  const start = parseISO(startIso);
  const end = parseISO(endIso);
  const day = (date: Date, pattern: string) => format(date, pattern, { locale: es });
  if (start.getFullYear() !== end.getFullYear())
    return `entre el ${day(start, "d 'de' MMMM 'de' yyyy")} y el ${day(end, "d 'de' MMMM 'de' yyyy")}`;
  if (start.getMonth() !== end.getMonth())
    return `entre el ${day(start, "d 'de' MMMM")} y el ${day(end, "d 'de' MMMM 'de' yyyy")}`;
  return `entre los días ${day(start, 'd')} al ${day(end, "d 'de' MMMM 'de' yyyy")}`;
}

/** "18 de junio de 2025". A timestamp is read in local time, so the day is the user's. */
export const longDate = (iso: string): string =>
  format(parseISO(iso), "d 'de' MMMM 'de' yyyy", { locale: es });

export type BannerTone = 'info' | 'warning' | 'error';
export interface ProfileBanner {
  /** Under `profile.banners` in the catalog. */
  key: 'removed' | 'sickToday' | 'sick' | 'calvingLate' | 'calving' | 'pregnancyCheck' | 'heat';
  tone: BannerTone;
  params: Record<string, string | number>;
}

/**
 * What the profile tells the farmer before anything else: a sick animal first (don't milk her),
 * then the date windows the repro engine projects, in the order they'd be acted on.
 */
export function profileBanners(animal: AnimalDetail, today: Date): ProfileBanner[] {
  const noun = nounOf(animal);
  if (animal.status === 'REMOVED') {
    return [
      {
        key: 'removed',
        tone: 'info',
        params: {
          noun,
          reason: animal.removed_reason ?? '',
          date: animal.removed_at ? longDate(animal.removed_at) : '',
        },
      },
    ];
  }
  const banners: ProfileBanner[] = [];
  if (animal.is_sick) {
    const days = animal.sick_since
      ? differenceInCalendarDays(today, parseISO(animal.sick_since))
      : 0;
    banners.push(
      days > 0
        ? { key: 'sick', tone: 'error', params: { noun, count: days } }
        : { key: 'sickToday', tone: 'error', params: { noun } },
    );
  }
  const { calving, pregnancy_check: check, next_heat: heat } = animal.projection;
  if (calving) {
    const late = differenceInCalendarDays(today, parseISO(calving.end)) > 0;
    banners.push({
      key: late ? 'calvingLate' : 'calving',
      tone: late ? 'warning' : 'info',
      params: { window: windowText(calving.start, calving.end) },
    });
  }
  if (check)
    banners.push({
      key: 'pregnancyCheck',
      tone: 'info',
      params: { window: windowText(check.start, check.end) },
    });
  if (heat)
    banners.push({
      key: 'heat',
      tone: 'info',
      params: { window: windowText(heat.start, heat.end) },
    });
  return banners;
}

/** Cows show DEL; heifers, calves and bulls show their age instead (domain-model §3.1). */
export const showsDel = (animal: Pick<AnimalDetail, 'kind'>) => animal.kind === 'VACA';

export const ageInMonths = (animal: Pick<AnimalDetail, 'birth_date'>, today: Date) =>
  differenceInMonths(today, parseISO(animal.birth_date));

export interface Weighing {
  kg: number;
  on: string;
  /** The event behind it, when it came from the bitácora (the registry's milestones have none). */
  event?: AnimalEvent;
}

/** Weighings from the bitácora, newest first. */
export function weighings(events: AnimalEvent[]): Weighing[] {
  return events
    .filter((event) => event.type === 'WEIGHT' && typeof event.payload.kg === 'number')
    .map((event) => ({ kg: event.payload.kg as number, on: event.occurred_on, event }));
}

/** The latest known weight: the last weighing, else the latest registry milestone. */
export function currentWeight(animal: AnimalDetail, events: AnimalEvent[]): number | null {
  const last = weighings(events)[0];
  if (last) return last.kg;
  return animal.weight_one_year_kg ?? animal.weight_weaning_kg ?? animal.weight_birth_kg ?? null;
}

export interface Diet {
  diet: string;
  dietType: string | null;
  dailyKg: number | null;
  dailyCost: number | null;
  since: string;
  eventId: string;
}

/** The diet details an event carries: its own (DIET_CHANGE) or one made alongside an illness. */
function dietOf(event: AnimalEvent): Omit<Diet, 'since' | 'eventId'> | null {
  const details =
    event.type === 'DIET_CHANGE'
      ? event.payload
      : (event.payload.diet_change as Record<string, unknown> | null | undefined);
  if (!details || typeof details.diet !== 'string') return null;
  return {
    diet: details.diet,
    dietType: typeof details.diet_type === 'string' ? details.diet_type : null,
    dailyKg: typeof details.daily_kg === 'number' ? details.daily_kg : null,
    dailyCost: typeof details.daily_cost === 'number' ? details.daily_cost : null,
  };
}

/** Diet changes, newest first. */
export function dietHistory(events: AnimalEvent[]): Diet[] {
  return events.flatMap((event) => {
    const diet = dietOf(event);
    return diet ? [{ ...diet, since: event.occurred_on, eventId: event.id }] : [];
  });
}

/** The bitácora's Tipo column and its filter chips. */
export const EVENT_CATEGORIES = [
  'reproduccion',
  'salud',
  'dieta',
  'vacunas',
  'potrero',
  'desarrollo',
  'alta',
  'baja',
] as const;
export type EventCategory = (typeof EVENT_CATEGORIES)[number];

const CATEGORY_OF: Record<AnimalEvent['type'], EventCategory> = {
  HEAT: 'reproduccion',
  PREGNANCY_CHECK: 'reproduccion',
  CALVING: 'reproduccion',
  ABORTION: 'reproduccion',
  ILLNESS: 'salud',
  ACCIDENT: 'salud',
  MEDICAL_TREATMENT: 'salud',
  TREATMENT_FOLLOWUP: 'salud',
  DIET_CHANGE: 'dieta',
  VACCINATION: 'vacunas',
  GROUP_CHANGE: 'potrero',
  WEIGHT: 'desarrollo',
  ALTA: 'alta',
  REMOVAL: 'baja',
};
export const categoryOf = (event: Pick<AnimalEvent, 'type'>): EventCategory =>
  CATEGORY_OF[event.type];

/**
 * The i18n key (under `profile.events`) and params for the Evento column. Each type has a
 * plain label; the repro and health types name what happened.
 */
export function eventLabel(event: AnimalEvent): { key: string; params?: Record<string, string> } {
  const p = event.payload as Record<string, unknown>;
  const str = (value: unknown) => (typeof value === 'string' ? value : '');
  switch (event.type) {
    case 'HEAT':
      return { key: `heat.${str(p.outcome)}` };
    case 'PREGNANCY_CHECK':
      return { key: `pregnancy.${str(p.result)}` };
    case 'CALVING':
      return { key: `calving.${str(p.timing)}` };
    case 'ABORTION':
      return { key: `abortion.${str(p.kind)}` };
    case 'ILLNESS':
      return { key: 'illness', params: { illness: str(p.illness) } };
    case 'TREATMENT_FOLLOWUP':
      return { key: `followup.${str(p.outcome)}` };
    case 'DIET_CHANGE':
      return { key: 'diet', params: { diet: str(p.diet) } };
    case 'WEIGHT':
      return { key: 'weight', params: { kg: String(p.kg ?? '') } };
    case 'REMOVAL':
      return { key: 'removal', params: { reason: str(p.reason) } };
    default:
      return { key: event.type };
  }
}

export interface BitacoraFilter {
  categories: EventCategory[];
  from: string | null;
  to: string | null;
}

export const NO_FILTER: BitacoraFilter = { categories: [], from: null, to: null };

export function filterEvents(events: AnimalEvent[], filter: BitacoraFilter): AnimalEvent[] {
  return events.filter(
    (event) =>
      (filter.categories.length === 0 || filter.categories.includes(categoryOf(event))) &&
      (!filter.from || event.occurred_on >= filter.from) &&
      (!filter.to || event.occurred_on <= filter.to),
  );
}

/** The last repro milestone the Reproducción card shows, by sex and state. */
export function reproMilestone(
  animal: AnimalDetail,
): { key: 'lastCalving' | 'lastService'; date: string } | null {
  if (animal.sex === 'MACHO') return null;
  // A milking cow counts from her calving; otherwise the last service matters (V 4048-10361).
  if (animal.lactation_state === 'LACTANDO' && animal.last_calving_date)
    return { key: 'lastCalving', date: animal.last_calving_date };
  if (animal.last_service_date) return { key: 'lastService', date: animal.last_service_date };
  return animal.last_calving_date ? { key: 'lastCalving', date: animal.last_calving_date } : null;
}
