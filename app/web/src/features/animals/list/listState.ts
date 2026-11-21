import { addDays, format, subYears } from 'date-fns';

import type { components, operations } from '../../../api/schema';
import type { DataTableSort } from '../../../ui/DataTable';

export type Breed = components['schemas']['Breed'];
export type ReproState = components['schemas']['ReproState'];
export type RemovalReason = components['schemas']['RemovalReason'];
export type GroupPreset = components['schemas']['GroupPreset'];
export type ListQuery = NonNullable<operations['listAnimals']['parameters']['query']>;

/** The three lists of the Vacas tab, by the slug they carry in the URL. */
export const LIST_KINDS = {
  vacas: 'VACA',
  vaquillas: 'VAQUILLA',
  toros: 'TORO',
} as const satisfies Record<string, components['schemas']['AnimalKind']>;
export type ListKind = keyof typeof LIST_KINDS;

export const BREEDS: Breed[] = [
  'HOLSTEIN',
  'JERSEY',
  'SIMMENTAL',
  'PARDO_SUIZO',
  'GUERNSEY',
  'AYRSHIRE',
  'SHORTHORN',
  'NORMANDO',
  'OTRA',
];
export const GROUP_PRESETS: GroupPreset[] = [
  'GENERAL',
  'ALTA_PRODUCCION',
  'SECAS_RETO',
  'RECIEN_PARIDAS',
  'ENFERMAS',
];
const COW_REPRO: ReproState[] = ['ABIERTA', 'RECIEN_PARIDA', 'SERVIDA', 'GESTANTE', 'SECA'];
const HEIFER_REPRO: ReproState[] = ['VAQUILLA', 'SERVIDA', 'GESTANTE'];
/** ERROR_REGISTRO deletes the animal, so there is nothing to list under it. */
export const LISTED_REMOVALS: RemovalReason[] = ['VENTA_OTRO_RANCHO', 'VENTA_RASTRO', 'MUERTE'];
/** Bull_Age: under one year, then each year up to 9+. */
export const BULL_AGES = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9+'] as const;

export type Category = 'grupo' | 'raza' | 'repro' | 'salud' | 'bajas' | 'edad';

/** Which categories each list offers, in the sheet's order (B1), and the value each preselects. */
export function categoriesFor(kind: ListKind): { category: Category; defaultVariable: string }[] {
  if (kind === 'toros') {
    return [
      { category: 'raza', defaultVariable: 'HOLSTEIN' },
      { category: 'edad', defaultVariable: '0' },
      { category: 'bajas', defaultVariable: 'VENTA_OTRO_RANCHO' },
    ];
  }
  return [
    { category: 'grupo', defaultVariable: 'GENERAL' },
    { category: 'raza', defaultVariable: 'HOLSTEIN' },
    { category: 'repro', defaultVariable: kind === 'vacas' ? 'ABIERTA' : 'VAQUILLA' },
    { category: 'salud', defaultVariable: 'SALUDABLE' },
    { category: 'bajas', defaultVariable: 'VENTA_OTRO_RANCHO' },
  ];
}

/** The values a category offers; group ids from the ranch's own groups come after the presets. */
export function variablesFor(kind: ListKind, category: Category, customGroups: string[] = []) {
  switch (category) {
    case 'grupo':
      return [...GROUP_PRESETS, ...customGroups];
    case 'raza':
      return BREEDS;
    case 'repro':
      return kind === 'vacas' ? COW_REPRO : HEIFER_REPRO;
    case 'salud':
      return ['SALUDABLE', 'ENFERMA'];
    case 'bajas':
      return LISTED_REMOVALS;
    case 'edad':
      return [...BULL_AGES];
  }
}

/** Sortable columns and the API sort key that orders them ascending. */
const SORT_KEYS = {
  id: { asc: 'control_id', desc: '-control_id' },
  // More days in milk means an older calving.
  dim: { asc: '-last_calving_date', desc: 'last_calving_date' },
  edad: { asc: '-birth_date', desc: 'birth_date' },
} as const satisfies Record<string, { asc: ListQuery['sort']; desc: ListQuery['sort'] }>;
export type SortColumn = keyof typeof SORT_KEYS;

export interface ListState {
  kind: ListKind;
  q: string;
  filter: { category: Category; variable: string } | null;
  sort: DataTableSort | null;
  page: number;
}

const isKind = (value: string | null): value is ListKind =>
  value !== null && Object.hasOwn(LIST_KINDS, value);

/**
 * Reads the list from the URL. Anything a list does not offer (a hand-edited or stale link) falls
 * back to no filter, no sort or page 1 rather than an error.
 */
export function parseListState(params: URLSearchParams): ListState {
  const rawKind = params.get('tipo');
  const kind: ListKind = isKind(rawKind) ? rawKind : 'vacas';
  const q = (params.get('q') ?? '').slice(0, 60);

  const category = params.get('filtro') as Category | null;
  const variable = params.get('valor');
  const offered = categoriesFor(kind).some((c) => c.category === category);
  const uuidish = /^[0-9a-f-]{36}$/i;
  const validVariable =
    category !== null &&
    variable !== null &&
    offered &&
    ((variablesFor(kind, category) as readonly string[]).includes(variable) ||
      (category === 'grupo' && uuidish.test(variable)));
  const filter = validVariable ? { category, variable } : null;

  const [column, direction] = (params.get('orden') ?? '').split(':');
  const sortable = column !== undefined && Object.hasOwn(SORT_KEYS, column);
  const sort =
    sortable && (direction === 'asc' || direction === 'desc')
      ? { column, direction: direction as DataTableSort['direction'] }
      : null;

  const page = Number.parseInt(params.get('pagina') ?? '1', 10);
  return { kind, q, filter, sort, page: Number.isFinite(page) && page >= 1 ? page : 1 };
}

/** The URL for a list state; defaults stay out of it so a plain /vacas link is the cow list. */
export function listStateParams(state: ListState): URLSearchParams {
  const params = new URLSearchParams();
  if (state.kind !== 'vacas') params.set('tipo', state.kind);
  if (state.q) params.set('q', state.q);
  if (state.filter) {
    params.set('filtro', state.filter.category);
    params.set('valor', state.filter.variable);
  }
  if (state.sort) params.set('orden', `${state.sort.column}:${state.sort.direction}`);
  if (state.page > 1) params.set('pagina', String(state.page));
  return params;
}

const isoDate = (date: Date) => format(date, 'yyyy-MM-dd');

/** Bull age bucket N: N full years old, so born in (today − N−1 years, today − N years]. */
export function ageRange(bucket: string, today: Date): Pick<ListQuery, 'born_from' | 'born_to'> {
  if (bucket === '9+') return { born_to: isoDate(subYears(today, 9)) };
  const years = Number(bucket);
  return {
    born_from: isoDate(addDays(subYears(today, years + 1), 1)),
    born_to: isoDate(subYears(today, years)),
  };
}

/** The GET /api/animals query for a list state. */
export function listQuery(state: ListState, today: Date, pageSize = 10): ListQuery {
  const query: ListQuery = { kind: LIST_KINDS[state.kind], page: state.page, page_size: pageSize };
  const q = state.q.trim();
  if (q) query.q = q;
  if (state.sort) {
    query.sort = SORT_KEYS[state.sort.column as SortColumn][state.sort.direction];
  }
  const filter = state.filter;
  if (!filter) return query;
  switch (filter.category) {
    case 'grupo':
      query.group = filter.variable;
      break;
    case 'raza':
      query.breed = filter.variable as Breed;
      break;
    case 'repro':
      query.repro = filter.variable as ReproState;
      break;
    case 'salud':
      query.health = filter.variable as 'SALUDABLE' | 'ENFERMA';
      break;
    case 'bajas':
      query.removed_reason = filter.variable as RemovalReason;
      break;
    case 'edad':
      Object.assign(query, ageRange(filter.variable, today));
      break;
  }
  return query;
}
