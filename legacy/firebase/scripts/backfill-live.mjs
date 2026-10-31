// Prepares live data for the rules. DRY RUN unless --apply is passed. Prints counts only.
//   Stage 1: node scripts/backfill-live.mjs --project smartbell-app-2025 [--apply]
//            Adds active workers to memberIds, removes people no longer active.
//   Stage 3: node scripts/backfill-live.mjs --project smartbell-app-2025 --reconcile [--apply]
//            Removes only. Adding again would turn pending invites into members.
// Both stamp missing ranch_id from the parent cow or bull.
import { parseArgs } from 'node:util';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import plan from '../functions/ranch-plan.js';

const { values } = parseArgs({
  options: {
    project: { type: 'string' },
    apply: { type: 'boolean', default: false },
    reconcile: { type: 'boolean', default: false },
  },
});
if (!values.project) throw new Error('Pass --project explicitly.');
const db = getFirestore(initializeApp({ credential: applicationDefault(), projectId: values.project }));
const writer = values.apply ? db.bulkWriter() : null;
writer?.onWriteError((err) => err.failedAttempts < 5); // retry a little; failures are counted below
console.log(values.apply ? 'APPLYING CHANGES' : 'DRY RUN: nothing will be written');

let failures = 0;
const write = (ref, data) => writer?.update(ref, data).catch(() => { failures += 1; });

const totals = { ranches: 0, noOwner: 0, added: 0, removedMembers: 0, removedInvites: 0, pending: 0 };
const liveRanches = new Set();
const referencedRanches = new Set();
for (const ranch of (await db.collection('Ranches').get()).docs) {
  liveRanches.add(ranch.id);
  const data = ranch.data();
  const changes = plan.planRanch(data);
  const addMembers = values.reconcile ? [] : changes.addMembers;
  totals.ranches += 1;
  if (!data.user_id) totals.noOwner += 1;
  totals.added += addMembers.length;
  totals.removedMembers += changes.removeMembers.length;
  totals.removedInvites += changes.removeInvited.length;
  totals.pending += changes.pendingInvites;
  // Field transforms, not whole arrays, so a live invite during the run isn't overwritten.
  // Firestore can't union and remove on one field in a single write, hence two writes.
  if (addMembers.length) write(ranch.ref, { memberIds: FieldValue.arrayUnion(...addMembers) });
  if (changes.removeMembers.length || changes.removeInvited.length) {
    write(ranch.ref, {
      ...(changes.removeMembers.length ? { memberIds: FieldValue.arrayRemove(...changes.removeMembers) } : {}),
      ...(changes.removeInvited.length ? { invitedUsers: FieldValue.arrayRemove(...changes.removeInvited) } : {}),
    });
  }
}
console.log(`Ranches: ${totals.ranches}; ${totals.noOwner} with no user_id (nobody can read those under the final rules)`);
console.log(`Members to add: ${totals.added}; members to remove: ${totals.removedMembers}; stale invites to remove: ${totals.removedInvites}`);
console.log(`Invited, not yet members: ${totals.pending}. After the final rules they must tap the ranch in the new app.`);

const ranchOf = new Map(); // parent path -> ranch_id, so logs of one cow share one read
async function parentRanch(ref) {
  if (!ranchOf.has(ref.path)) ranchOf.set(ref.path, (await ref.get()).get('ranch_id'));
  return ranchOf.get(ref.path);
}

for (const [name, field] of Object.entries(plan.PARENT_FIELD)) {
  const snap = await db.collection(name).select('ranch_id', field).get();
  let missing = 0;
  let fixable = 0;
  for (const doc of snap.docs) {
    if (doc.get('ranch_id')) {
      referencedRanches.add(doc.get('ranch_id').id);
      continue;
    }
    missing += 1;
    const parent = doc.get(field);
    const ranchId = parent ? await parentRanch(parent) : undefined;
    if (!ranchId) continue;
    fixable += 1;
    write(doc.ref, { ranch_id: ranchId });
  }
  console.log(`${name}: ${snap.size} docs, ${missing} without ranch_id, ${fixable} fixable, ${missing - fixable} orphaned`);
}
for (const name of ['Cows', 'Bulls', 'Tasks', 'Groups', 'Groups_Bulls', 'MilkPrices', 'Cows_In_Production_change']) {
  const snap = await db.collection(name).select('ranch_id').get();
  for (const doc of snap.docs) if (doc.get('ranch_id')) referencedRanches.add(doc.get('ranch_id').id);
  console.log(`${name}: ${snap.size} docs, ${snap.docs.filter((d) => !d.get('ranch_id')).length} orphaned`);
}

// Data from ranches deleted before onRanchChanged existed: block those ids from being reclaimed.
const deleted = [...referencedRanches].filter((id) => !liveRanches.has(id));
for (const id of deleted) writer?.set(db.collection('deletedRanches').doc(id), { deletedAt: FieldValue.serverTimestamp() }).catch(() => { failures += 1; });
console.log(`Deleted ranches with data left behind: ${deleted.length}`);

await writer?.close();
if (failures) {
  console.error(`${failures} WRITES FAILED. Run the same command again, with the same flags, before publishing any rules.`);
  process.exitCode = 1;
}
