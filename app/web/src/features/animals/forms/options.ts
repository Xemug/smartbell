import type { TFunction } from 'i18next';

import type { SelectOption } from '../../../ui/Select';
import { BREEDS } from '../list/listState';
import { CROSSBREED_LEVELS, NO_REPRO_STAGE, REPRO_STAGES, STAGES, type Sex } from './formModel';

export const breedOptions = (t: TFunction): SelectOption[] =>
  BREEDS.map((breed) => ({ value: breed, label: t(`animals.values.raza.${breed}`) }));

export const crossbreedOptions = (t: TFunction): SelectOption[] =>
  CROSSBREED_LEVELS.map((level) => ({ value: level, label: t(`animalForm.crossbreed.${level}`) }));

export const stageOptions = (t: TFunction, sex: Sex): SelectOption[] =>
  STAGES[sex].map((stage) => ({ value: stage, label: t(`animalForm.stages.${stage}`) }));

export const reproOptions = (t: TFunction): SelectOption[] => [
  { value: NO_REPRO_STAGE, label: t('animalForm.reproNone') },
  ...REPRO_STAGES.map((stage) => ({ value: stage, label: t(`animals.values.repro.${stage}`) })),
];
