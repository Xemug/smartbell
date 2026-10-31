// Pure planning logic for backfill-live.mjs, kept separate so tests can run it.

/** memberIds a ranch should hold: everyone already listed in workesList, except the owner. */
export function planMemberIds(ranch) {
  const owner = ranch.user_id?.id;
  const fromWorkers = (ranch.workesList ?? []).map((w) => w?.user?.id).filter(Boolean);
  return [...new Set([...(ranch.memberIds ?? []), ...fromWorkers])].filter((uid) => uid !== owner).sort();
}

export const sameList = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());

/** Parent reference that can supply a missing ranch_id, per log collection. */
export const PARENT_FIELD = {
  BullWeightHeight: 'bull_id', BullDietChanges: 'bull_id', Group_bull_changes: 'bull_id',
  CowWeightHeight: 'cow_id', cowProductionPerDay: 'cow_id', CowsDietChanges: 'cow_id',
  CowReproductionState: 'cow_id', cowHealth: 'cow_id', Group_cow_changes: 'cow_id',
};
export const RANCH_COLLECTIONS = [
  ...Object.keys(PARENT_FIELD), 'Cows', 'Bulls', 'Tasks', 'Groups', 'Groups_Bulls', 'MilkPrices', 'Cows_In_Production_change',
];
