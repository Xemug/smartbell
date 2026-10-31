// Who should have access to a ranch, from workesList. Used by the trigger and the backfill.

const DISABLED = ['Disabled', 'Desactivado'];

/** Workers the owner hasn't disabled. A row is added at invite time; status is the only other signal. */
function activeWorkerIds(ranch) {
  const rows = (ranch.workesList ?? []).filter((w) => w?.user?.id && !DISABLED.includes(w.status));
  return new Set(rows.map((w) => w.user.id));
}

/** Who to add to and remove from a ranch so it matches workesList. */
function planRanch(ranch) {
  const owner = ranch.user_id?.id;
  const active = activeWorkerIds(ranch);
  const members = ranch.memberIds ?? [];
  const invited = ranch.invitedUsers ?? [];
  return {
    addMembers: [...active].filter((uid) => uid !== owner && !members.includes(uid)).sort(),
    removeMembers: members.filter((uid) => !active.has(uid)),
    // Today, removing a worker only clears workesList. A leftover invite would let them rejoin.
    removeInvited: invited.filter((ref) => !active.has(ref.id)),
    pendingInvites: invited.filter((ref) => active.has(ref.id) && !members.includes(ref.id)).length,
  };
}

/** Parent reference that can supply a missing ranch_id, per log collection. */
const PARENT_FIELD = {
  BullWeightHeight: 'bull_id', BullDietChanges: 'bull_id', Group_bull_changes: 'bull_id',
  CowWeightHeight: 'cow_id', cowProductionPerDay: 'cow_id', CowsDietChanges: 'cow_id',
  CowReproductionState: 'cow_id', cowHealth: 'cow_id', Group_cow_changes: 'cow_id',
};

module.exports = { planRanch, PARENT_FIELD };
