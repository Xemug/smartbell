import type { TFunction } from 'i18next';

import {
  iconDiscDim,
  iconDiscHeat,
  iconDiscPregnant,
  iconDiscSick,
  type Glyph,
} from '../../ui/icons/glyphs';
import type { GroupOut, KpiIndicator } from './api';

export const GROUPS_PATH = '/grupos';
export const NEW_GROUP_PATH = `${GROUPS_PATH}/nuevo`;
export const HEIFER_GROUPS_PATH = `${GROUPS_PATH}/vaquillas`;
export const BULL_GROUPS_PATH = `${GROUPS_PATH}?tipo=toros`;
export const NEW_BULL_GROUP_PATH = `${GROUPS_PATH}/toros/nuevo`;
export const groupPath = (id: string) => `${GROUPS_PATH}/${id}`;

export const KPI_INDICATORS: KpiIndicator[] = ['EN_CELO', 'PRENADAS', 'ENFERMAS', 'DIM'];
export const KPI_ICONS: Record<KpiIndicator, Glyph> = {
  EN_CELO: iconDiscHeat,
  PRENADAS: iconDiscPregnant,
  ENFERMAS: iconDiscSick,
  DIM: iconDiscDim,
};

/** A bull group holds the bulls on the ranch; every other stored group is a cow potrero. */
export const isBullGroup = (group: Pick<GroupOut, 'type'>) => group.type === 'TORO';

/** Where an animal can be moved by hand: groups of its own kind, never an AUTO one (its rule
 * picks its cows). Kinds never mix. */
export function movableGroups(groups: GroupOut[], bulls: boolean): GroupOut[] {
  return groups.filter((g) => g.selection !== 'AUTO' && isBullGroup(g) === bulls);
}

/** A preset shows its name in the reader's language; a custom group, as typed. */
export function groupName(group: Pick<GroupOut, 'name' | 'preset'>, t: TFunction): string {
  return group.preset ? t(`groups.presets.${group.preset}`) : group.name;
}

export function groupDescription(
  group: Pick<GroupOut, 'description' | 'preset'>,
  t: TFunction,
): string | null {
  if (group.description) return group.description;
  return group.preset ? t(`groups.presetDescriptions.${group.preset}`) : null;
}

/** "000" as the cards draw it; "—" when nobody is milking for a DEL average. */
export function kpiFigure(value: number | null | undefined): string {
  return value === null || value === undefined ? '—' : String(value).padStart(3, '0');
}
