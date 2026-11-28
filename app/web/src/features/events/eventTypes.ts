import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

import {
  iconDiet,
  iconDiscCalving,
  iconDiscHeat,
  iconDiscPregnant,
  iconDiscSick,
  type Glyph,
} from '../../ui/icons/glyphs';
import type { AnimalDetail } from '../animals/profile/api';

/** What the launcher offers: the event-flows 1.0 entries, as the bitácora types they record. */
export type EventKind =
  | 'HEAT'
  | 'PREGNANCY_CHECK'
  | 'CALVING'
  | 'ABORTION'
  | 'ILLNESS'
  | 'ACCIDENT'
  | 'MEDICAL_TREATMENT'
  | 'DIET_CHANGE';

/** The profile card the launcher is opened from. */
export type LauncherGroup = 'reproduccion' | 'salud';

export const LAUNCHER_GROUPS: Record<LauncherGroup, readonly EventKind[]> = {
  reproduccion: ['HEAT', 'PREGNANCY_CHECK', 'CALVING', 'ABORTION'],
  // Potrero changes stay on the profile's Potrero fact (Cambiar), not here.
  salud: ['ILLNESS', 'ACCIDENT', 'MEDICAL_TREATMENT', 'DIET_CHANGE'],
};

export const EVENT_ICONS: Record<EventKind, Glyph> = {
  HEAT: iconDiscHeat,
  PREGNANCY_CHECK: iconDiscPregnant,
  CALVING: iconDiscCalving,
  ABORTION: iconDiscCalving,
  ILLNESS: iconDiscSick,
  ACCIDENT: iconDiscSick,
  MEDICAL_TREATMENT: iconDiscSick,
  DIET_CHANGE: iconDiet,
};

type Projection = AnimalDetail['projection'];
type WindowField = 'next_heat' | 'pregnancy_check' | 'calving';

/** The computed window each confirmation lives in ("está dentro de los días estimados"). Aborto
 * has none: a loss can happen any day of a pregnancy. */
const WINDOWS: Partial<Record<EventKind, WindowField>> = {
  HEAT: 'next_heat',
  PREGNANCY_CHECK: 'pregnancy_check',
  CALVING: 'calving',
};

/** Why an entry is disabled, as an i18n key under `events.reasons` and its values. */
export interface DisabledReason {
  key: 'opensOn' | 'closedOn' | 'noWindow' | 'soon';
  params?: Record<string, string>;
}

export interface LauncherEntry {
  kind: EventKind;
  reason: DisabledReason | null;
}

const isoDay = (date: Date) => format(date, 'yyyy-MM-dd');
/** Today's date for an event's `occurred_on`. */
export const today = () => isoDay(new Date());
/** "3 dic": short enough for the line under a launcher entry. */
export const shortDay = (iso: string) => format(parseISO(iso), 'd MMM', { locale: es });

/** Null when today is inside the window; otherwise why not, saying when it opens if known. */
export function windowReason(
  projection: Projection,
  kind: EventKind,
  today: Date,
): DisabledReason | null {
  const field = WINDOWS[kind];
  if (!field) return null;
  const window = projection[field];
  if (!window) return { key: 'noWindow' };
  const day = isoDay(today);
  if (day < window.start) return { key: 'opensOn', params: { date: shortDay(window.start) } };
  if (day > window.end) return { key: 'closedOn', params: { date: shortDay(window.end) } };
  return null;
}

/** Reproduction entries are for females only; a bull gets the health ones. */
export function launcherGroups(animal: AnimalDetail): LauncherGroup[] {
  return animal.sex === 'HEMBRA' ? ['reproduccion', 'salud'] : ['salud'];
}

/**
 * The launcher's entries for one card. A reproduction entry is enabled only inside the cow's
 * window; an entry whose flow has not been built yet says it is coming. The window reason comes
 * first: it is a fact about the cow, and it still holds once the flow lands.
 */
export function launcherEntries(
  animal: AnimalDetail,
  group: LauncherGroup,
  today: Date,
  hasFlow: (kind: EventKind) => boolean,
): LauncherEntry[] {
  return LAUNCHER_GROUPS[group].map((kind) => ({
    kind,
    reason:
      windowReason(animal.projection, kind, today) ?? (hasFlow(kind) ? null : { key: 'soon' }),
  }));
}

/** The snackbar's message key under `events.recorded` (event-flows 1.11). */
export function recordedKey(kind: EventKind): string {
  switch (kind) {
    case 'HEAT':
    case 'PREGNANCY_CHECK':
    case 'CALVING':
    case 'ABORTION':
    case 'DIET_CHANGE':
      return kind;
    default:
      return 'HEALTH';
  }
}
