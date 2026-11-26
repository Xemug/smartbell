import type { AnimalDetail, AnimalEvent } from './api';

/** A cow as the API returns her; `projection` fields merge into a quiet projection. */
export function detail(
  fields: Omit<Partial<AnimalDetail>, 'projection'> & {
    projection?: Partial<AnimalDetail['projection']>;
  } = {},
): AnimalDetail {
  return {
    id: 'a-1',
    sex: 'HEMBRA',
    kind: 'VACA',
    control_id: '00001',
    name: null,
    siniiga: null,
    birth_date: '2020-01-15',
    breed: 'HOLSTEIN',
    crossbreed_level: 'FB',
    contributing_breed: null,
    development_stage: 'AUTO',
    photo_url: null,
    group_id: null,
    status: 'ACTIVE',
    removed_reason: null,
    removed_at: null,
    dam_id: null,
    sire_id: null,
    birth_length_cm: null,
    weight_birth_kg: null,
    weight_weaning_kg: null,
    weight_one_year_kg: null,
    repro_state: 'ABIERTA',
    lactation_state: 'LACTANDO',
    lactation_number: 2,
    last_calving_date: '2026-09-27',
    last_heat_date: null,
    last_service_date: null,
    service_number_in_lactation: null,
    pregnancy_confirmed_date: null,
    expected_calving_date: null,
    is_sick: false,
    sick_since: null,
    milk_withdrawal_until: null,
    ...fields,
    projection: {
      development_stage: 'VACA_ADULTA',
      dim: 60,
      days_open: 60,
      breeding_unlocked: true,
      next_heat: null,
      pregnancy_check: null,
      calving: null,
      dry_off_date: null,
      close_up_date: null,
      warnings: [],
      ...fields.projection,
    },
  } as AnimalDetail;
}

export function event(
  type: AnimalEvent['type'],
  payload: Record<string, unknown> = {},
  fields: Partial<AnimalEvent> = {},
): AnimalEvent {
  return {
    id: `${type}-${fields.occurred_on ?? '2026-11-01'}`,
    animal_id: 'a-1',
    type,
    occurred_on: '2026-11-01',
    recorded_by: null,
    recorded_by_name: null,
    created_at: '2026-11-01T10:00:00Z',
    description: null,
    comments: null,
    payload: { type, ...payload },
    deletable: !['ALTA', 'HEAT', 'PREGNANCY_CHECK', 'CALVING', 'ABORTION', 'REMOVAL'].includes(
      type,
    ),
    ...fields,
  };
}
