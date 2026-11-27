import { describe, expect, it } from 'vitest';

import type { AnimalDetail } from './api';
import {
  currentWeight,
  dietHistory,
  eventLabel,
  filterEvents,
  profileBanners,
  recordTabs,
  reproMilestone,
  treatmentOf,
  windowText,
} from './profileFacts';
import { detail, event } from './testData';

const TODAY = new Date(2026, 10, 26, 9);

const keys = (animal: AnimalDetail) => profileBanners(animal, TODAY).map((b) => b.key);

describe('windowText', () => {
  it('names one month once', () => {
    expect(windowText('2025-09-12', '2025-09-18')).toBe(
      'entre los días 12 al 18 de septiembre de 2025',
    );
  });
  it('names both months across a month end', () => {
    expect(windowText('2026-11-26', '2026-12-02')).toBe(
      'entre el 26 de noviembre y el 2 de diciembre de 2026',
    );
  });
  it('names both years across a year end', () => {
    expect(windowText('2026-12-28', '2027-01-03')).toBe(
      'entre el 28 de diciembre de 2026 y el 3 de enero de 2027',
    );
  });
});

// The fixture herd's prototype cows (seed/fixture_herd.py), as their projections come back.
describe('profileBanners for the fixture cows', () => {
  const heat = { start: '2026-11-26', end: '2026-12-02' };
  it('00001: sick for 5 days, then her heat window', () => {
    const banners = profileBanners(
      detail({ is_sick: true, sick_since: '2026-11-21', projection: { next_heat: heat } }),
      TODAY,
    );
    expect(banners.map((b) => [b.key, b.tone])).toEqual([
      ['sick', 'error'],
      ['heat', 'info'],
    ]);
    expect(banners[0]?.params.count).toBe(5);
  });
  it('00002: the calving window has passed', () => {
    const cow = detail({
      projection: { calving: { start: '2026-11-16', end: '2026-11-22' } },
    });
    expect(profileBanners(cow, TODAY)[0]).toMatchObject({ key: 'calvingLate', tone: 'warning' });
  });
  it('00004: inside her heat window', () => {
    expect(keys(detail({ projection: { next_heat: heat } }))).toEqual(['heat']);
  });
  it('00005 and 00007: a calving window today or ahead', () => {
    const due = detail({ projection: { calving: { start: '2026-11-23', end: '2026-11-29' } } });
    const early = detail({ projection: { calving: { start: '2026-12-03', end: '2026-12-09' } } });
    expect(keys(due)).toEqual(['calving']);
    expect(keys(early)).toEqual(['calving']);
  });
  it('00006: inside the pregnancy-check window', () => {
    const cow = detail({
      projection: { pregnancy_check: { start: '2026-11-21', end: '2026-12-01' } },
    });
    expect(keys(cow)).toEqual(['pregnancyCheck']);
  });
  it('declared sick today says so without a count', () => {
    expect(keys(detail({ is_sick: true, sick_since: '2026-11-26' }))).toEqual(['sickToday']);
  });
  it('a removed animal shows only its removal', () => {
    const cow = detail({
      status: 'REMOVED',
      removed_reason: 'VENTA_RASTRO',
      removed_at: '2026-11-20T12:00:00Z',
      is_sick: true,
      projection: { next_heat: heat },
    });
    expect(keys(cow)).toEqual(['removed']);
  });
});

describe('bitácora helpers', () => {
  const events = [
    event(
      'DIET_CHANGE',
      { diet: 'Materia seca', diet_type: 'Materia Seca', daily_kg: 10 },
      {
        occurred_on: '2026-11-16',
      },
    ),
    event('WEIGHT', { kg: 350 }, { occurred_on: '2026-11-10' }),
    event('CALVING', { timing: 'ESPERADO' }, { occurred_on: '2026-09-27' }),
    event(
      'ILLNESS',
      { illness: 'MASTITIS', diet_change: { diet: 'Dieta blanda' } },
      {
        occurred_on: '2026-08-01',
      },
    ),
  ];

  it('filters by category and by period', () => {
    const only = (categories: string[], from: string | null = null, to: string | null = null) =>
      filterEvents(events, { categories: categories as never, from, to }).map((e) => e.type);
    expect(only([])).toHaveLength(4);
    expect(only(['salud', 'dieta'])).toEqual(['DIET_CHANGE', 'ILLNESS']);
    expect(only([], '2026-09-01', '2026-11-12')).toEqual(['WEIGHT', 'CALVING']);
  });

  it('labels events by what happened', () => {
    expect(eventLabel(event('CALVING', { timing: 'ESPERADO' }))).toEqual({
      key: 'calving.ESPERADO',
    });
    expect(eventLabel(event('ILLNESS', { illness: 'MASTITIS' }))).toEqual({
      key: 'illness',
      params: { illness: 'MASTITIS' },
    });
    expect(eventLabel(event('HEAT', { outcome: 'INSEMINATED' }))).toEqual({
      key: 'heat.INSEMINATED',
    });
  });

  it('reads diets from diet changes and from illnesses that changed it', () => {
    expect(dietHistory(events).map((d) => [d.diet, d.since])).toEqual([
      ['Materia seca', '2026-11-16'],
      ['Dieta blanda', '2026-08-01'],
    ]);
  });

  it('weighs her by the last weighing, else the registry milestones', () => {
    expect(currentWeight(detail(), events)).toBe(350);
    expect(currentWeight(detail({ weight_weaning_kg: 80, weight_birth_kg: 45 }), [])).toBe(80);
    expect(currentWeight(detail(), [])).toBeNull();
  });

  it('shows the last calving while she milks, else the last service', () => {
    expect(reproMilestone(detail())).toEqual({ key: 'lastCalving', date: '2026-09-27' });
    const dry = detail({ lactation_state: 'SECA', last_service_date: '2026-03-01' });
    expect(reproMilestone(dry)).toEqual({ key: 'lastService', date: '2026-03-01' });
    expect(reproMilestone(detail({ sex: 'MACHO', kind: 'TORO' }))).toBeNull();
  });
});

describe('treatmentOf', () => {
  const treatment = {
    type: 'CORTICOIDE',
    corticoid_subtype: 'DEXAMETASONA',
    presentation: 'INYECCION',
    start_date: '2026-11-20',
    duration_days: 5,
    withdrawal_days: null,
  };
  it('reads a medicated heat, an illness and a follow-up that changed it', () => {
    const heat = event('HEAT', { outcome: 'DIRTY_MEDICATED', clean: false, treatment });
    expect(treatmentOf(heat)).toEqual({
      type: 'CORTICOIDE',
      corticoidSubtype: 'DEXAMETASONA',
      presentation: 'INYECCION',
      startDate: '2026-11-20',
      durationDays: 5,
      withdrawalDays: null,
    });
    expect(treatmentOf(event('ILLNESS', { illness: 'MASTITIS', treatment }))?.type).toBe(
      'CORTICOIDE',
    );
    const followup = event('TREATMENT_FOLLOWUP', { outcome: 'CHANGE', new_treatment: treatment });
    expect(treatmentOf(followup)?.durationDays).toBe(5);
  });
  it('is null for events without one', () => {
    expect(treatmentOf(event('HEAT', { outcome: 'DIRTY_NOT_MEDICATED', clean: false }))).toBeNull();
    expect(treatmentOf(event('WEIGHT', { kg: 350 }))).toBeNull();
  });
});

describe('recordTabs', () => {
  it('gives a cow litres, a bull his services, and a semen-only bull nothing else', () => {
    expect(recordTabs(detail())).toEqual(['bitacora', 'produccion', 'peso', 'dieta']);
    const bull = detail({ sex: 'MACHO', kind: 'TORO', bull_availability: 'AMBOS' });
    expect(recordTabs(bull)).toEqual(['bitacora', 'servicios', 'peso', 'dieta']);
    expect(recordTabs({ ...bull, bull_availability: 'SEMEN' })).toEqual(['servicios']);
  });
});
