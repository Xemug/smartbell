import { differenceInCalendarDays, differenceInMonths, parseISO } from 'date-fns';
import { z } from 'zod';

import type { components } from '../../../api/schema';

export type Sex = components['schemas']['Sex'];
export type Breed = components['schemas']['Breed'];
export type CrossbreedLevel = components['schemas']['CrossbreedLevel'];
export type DevelopmentStage = components['schemas']['DevelopmentStage'];
export type ReproState = components['schemas']['ReproState'];
export type DamStatus = components['schemas']['DamStatus'];
export type BullAvailability = components['schemas']['BullAvailability'];
export type AnimalCreate = components['schemas']['AnimalCreate'];
export type ParentCreate = components['schemas']['ParentCreate'];

export const CROSSBREED_LEVELS: CrossbreedLevel[] = ['FB', 'F4', 'F3', 'F2', 'F1'];

/** v4 §1.1 lists, with the bands the user confirmed (domain-model §7.6). AUTO comes first. */
export const STAGES: Record<Sex, DevelopmentStage[]> = {
  HEMBRA: [
    'AUTO',
    'TERNERA',
    'DESTETADA',
    'NOVILLA',
    'VACA_ADULTA',
    'CARGADA',
    'VACA_ADULTA_VACIA',
    'A_VERIFICAR',
  ],
  MACHO: ['AUTO', 'BECERRO', 'DESTETADO', 'NOVILLO', 'TORO'],
};

/** Stages of a female that can't have calved yet: no reproductive section for her. */
const YOUNG_FEMALE: DevelopmentStage[] = ['TERNERA', 'DESTETADA', 'NOVILLA'];

/** A calving needs 660 days of age (domain-model §3.11), the API's own rule. */
export const MIN_CALVING_AGE_DAYS = 660;

/**
 * "Etapa reproductiva" choices for an adult female. VAQUILLA is the never-calved state (her stage
 * says that) and RECIEN_PARIDA was dropped (§7.6).
 */
export const REPRO_STAGES: ReproState[] = ['ABIERTA', 'SERVIDA', 'GESTANTE', 'SECA'];
/** "Ninguna": the select can't hold an empty value. */
export const NO_REPRO_STAGE = 'NONE';

export const DAM_STATUSES: DamStatus[] = [
  'VIVA',
  'MUERTA_DESECHO',
  'VENDIDA_OTRO_RANCHO',
  'VENDIDA_RASTRO',
];

const required = z.string().trim().min(1, 'validation.required');
const optional = z.string().trim();

export const animalSchema = z
  .object({
    sex: z.enum(['HEMBRA', 'MACHO']),
    controlId: required.max(60),
    birthDate: required,
    breed: z.string(),
    groupId: z.string(),
    crossbreedLevel: z.string(),
    contributingBreed: z.string(),
    developmentStage: z.string(),
    bullAvailability: z.string(),
    siniiga: optional,
    lastCalvingDate: optional,
    lactationNumber: optional,
    reproStage: z.string(),
    reproStageDate: optional,
    weightBirth: optional,
    weightWeaning: optional,
    weightOneYear: optional,
  })
  .superRefine((values, ctx) => {
    // §7.1: a cross names the breed it comes from.
    if (values.crossbreedLevel !== 'FB' && !values.contributingBreed) {
      ctx.addIssue({ code: 'custom', path: ['contributingBreed'], message: 'validation.required' });
    }
    // The API takes 0 to 30 lactations. Only checked when the section applies: it isn't sent
    // otherwise.
    const lactation = values.lactationNumber;
    const applies = showsRepro(values.sex, values.developmentStage, values.birthDate);
    if (applies && lactation && !(/^\d+$/.test(lactation) && Number(lactation) <= 30)) {
      ctx.addIssue({
        code: 'custom',
        path: ['lactationNumber'],
        message: 'animalForm.lactationRange',
      });
    }
  });
export type AnimalValues = z.infer<typeof animalSchema>;

export function defaultValues(sex: Sex, generalGroupId = ''): AnimalValues {
  return {
    sex,
    controlId: '',
    birthDate: '',
    breed: 'HOLSTEIN',
    groupId: generalGroupId,
    crossbreedLevel: 'FB',
    contributingBreed: '',
    developmentStage: 'AUTO',
    bullAvailability: 'EN_RANCHO',
    siniiga: '',
    lastCalvingDate: '',
    // Empty: the API sets the default from her age ("1" is the field's placeholder).
    lactationNumber: '',
    reproStage: NO_REPRO_STAGE,
    reproStageDate: '',
    weightBirth: '',
    weightWeaning: '',
    weightOneYear: '',
  };
}

/**
 * Whether "Información reproductiva" shows: females only, and not when the stage (declared, or
 * AUTO from a known birth date) says she is too young to have calved.
 */
export function showsRepro(
  sex: Sex,
  stage: string,
  birthDate: string,
  today: Date = new Date(),
): boolean {
  if (sex !== 'HEMBRA') return false;
  if (YOUNG_FEMALE.includes(stage as DevelopmentStage)) return false;
  if (stage === 'AUTO' && birthDate) {
    return ageInDays(birthDate, today) >= MIN_CALVING_AGE_DAYS;
  }
  return true;
}

/** A male is a bull (kind TORO) from 24 months, or when his stage says so (§7.1). Only a bull
 * goes into a bull group; a younger male keeps the cow potreros, as before bull groups. With no
 * birth date yet, an AUTO male counts as a bull, the usual case on this form. */
export const MALE_TORO_FROM_MONTHS = 24;
export function isBull(sex: Sex, stage: string, birthDate: string, today: Date = new Date()) {
  if (sex !== 'MACHO') return false;
  if (stage !== 'AUTO') return stage === 'TORO';
  if (!birthDate) return true;
  return differenceInMonths(today, parseISO(birthDate)) >= MALE_TORO_FROM_MONTHS;
}

/**
 * A heifer for the dam-status question (§7.1): a female whose reproductive section doesn't show,
 * so she hasn't calved.
 */
export function isHeifer(values: Pick<AnimalValues, 'sex' | 'developmentStage' | 'birthDate'>) {
  return (
    values.sex === 'HEMBRA' && !showsRepro(values.sex, values.developmentStage, values.birthDate)
  );
}

function ageInDays(birthDate: string, today: Date): number {
  return differenceInCalendarDays(today, parseISO(birthDate));
}

/** The parent chosen for a slot: an existing animal, or one to register with this animal. */
export type ParentChoice =
  { kind: 'existing'; id: string; controlId: string } | { kind: 'new'; body: ParentCreate };

export function parentLabel(choice: ParentChoice): string {
  return choice.kind === 'existing' ? choice.controlId : choice.body.control_id;
}

const blank = (value: string) => (value.trim() === '' ? null : value.trim());

/**
 * Fields under "Tengo más datos de mi animal". Collapsing it only hides them: what was entered is
 * still sent, and a refusal on one of them opens the section again.
 */
export const DETAILED_FIELDS: ReadonlySet<keyof AnimalValues> = new Set([
  'crossbreedLevel',
  'contributingBreed',
  'developmentStage',
  'bullAvailability',
  'siniiga',
  'lastCalvingDate',
  'lactationNumber',
  'reproStage',
  'reproStageDate',
  'weightBirth',
  'weightWeaning',
  'weightOneYear',
]);

/**
 * The create request for the form's values. Untouched detailed fields hold the API's defaults; the
 * reproductive inputs go only when that section applies to the animal.
 */
export function toCreateBody(
  values: AnimalValues,
  options: {
    dam: ParentChoice | null;
    sire: ParentChoice | null;
    damStatus: DamStatus | null;
    today?: Date;
  },
): AnimalCreate {
  const { dam, sire, damStatus } = options;
  const body: AnimalCreate = {
    sex: values.sex,
    control_id: values.controlId.trim(),
    birth_date: values.birthDate,
    breed: values.breed as Breed,
    group_id: values.groupId || null,
    crossbreed_level: values.crossbreedLevel as CrossbreedLevel,
    contributing_breed:
      values.crossbreedLevel === 'FB' ? null : ((values.contributingBreed || null) as Breed | null),
    // A stage left over from the other sex's list isn't sent.
    development_stage: STAGES[values.sex].includes(values.developmentStage as DevelopmentStage)
      ? (values.developmentStage as DevelopmentStage)
      : 'AUTO',
    siniiga: blank(values.siniiga),
    weight_birth_kg: blank(values.weightBirth),
    weight_weaning_kg: blank(values.weightWeaning),
    weight_one_year_kg: blank(values.weightOneYear),
  };
  if (values.sex === 'MACHO') body.bull_availability = values.bullAvailability as BullAvailability;

  if (showsRepro(values.sex, body.development_stage, values.birthDate, options.today)) {
    body.last_calving_date = blank(values.lastCalvingDate);
    const lactation = blank(values.lactationNumber);
    body.lactation_number = lactation === null ? null : Number(lactation);
    body.repro_stage =
      values.reproStage === NO_REPRO_STAGE ? null : (values.reproStage as ReproState);
    body.repro_stage_date = body.repro_stage ? blank(values.reproStageDate) : null;
  }

  if (dam?.kind === 'existing') body.dam_id = dam.id;
  if (dam?.kind === 'new') body.dam = dam.body;
  if (sire?.kind === 'existing') body.sire_id = sire.id;
  if (sire?.kind === 'new') body.sire = sire.body;
  if (dam && damStatus) body.dam_status = damStatus;
  return body;
}

/** The form field a refusal's `loc` points at (FastAPI shape `["body", ...]`). */
const FIELD_OF_LOC: Record<string, keyof AnimalValues> = {
  control_id: 'controlId',
  birth_date: 'birthDate',
  breed: 'breed',
  group_id: 'groupId',
  crossbreed_level: 'crossbreedLevel',
  contributing_breed: 'contributingBreed',
  development_stage: 'developmentStage',
  bull_availability: 'bullAvailability',
  siniiga: 'siniiga',
  last_calving_date: 'lastCalvingDate',
  lactation_number: 'lactationNumber',
  repro_stage: 'reproStage',
  repro_stage_date: 'reproStageDate',
  weight_birth_kg: 'weightBirth',
  weight_weaning_kg: 'weightWeaning',
  weight_one_year_kg: 'weightOneYear',
};

export interface FieldRefusal {
  /** The main form's field, when the refusal is about the animal itself. */
  field: keyof AnimalValues | null;
  /** `dam` or `sire` when it's about a parent (inline or by id). */
  parent: 'dam' | 'sire' | null;
  message: string;
}

export function fieldRefusal(loc: unknown[], message: string): FieldRefusal {
  const path = loc[0] === 'body' ? loc.slice(1) : loc;
  const head = String(path[0] ?? '');
  if (head === 'dam' || head === 'dam_id' || head === 'dam_status') {
    return { field: null, parent: 'dam', message };
  }
  if (head === 'sire' || head === 'sire_id') return { field: null, parent: 'sire', message };
  return { field: FIELD_OF_LOC[head] ?? null, parent: null, message };
}
