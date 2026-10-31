// Prepares live data for the strict rules. DRY RUN unless --apply is passed.
//   node scripts/backfill-live.mjs --project smartbell-app-2025            (reads only)
//   node scripts/backfill-live.mjs --project smartbell-app-2025 --apply    (writes)
// Prints counts only: no emails, phones, names or ids.
import { parseArgs } from 'node:util';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { PARENT_FIELD, RANCH_COLLECTIONS, planMemberIds, sameList } from './backfill-plan.mjs';

const { values } = parseArgs({ options: { project: { type: 'string' }, apply: { type: 'boolean', default: false } } });
if (!values.project) throw new Error('Pass --project explicitly.');
const app = initializeApp({ credential: applicationDefault(), projectId: values.project });
const db = getFirestore(app);
const writer = values.apply ? db.bulkWriter() : null;
console.log(values.apply ? 'APPLYING CHANGES' : 'DRY RUN: nothing will be written');

const ranches = await db.collection('Ranches').get();
let ranchChanges = 0;
let noOwner = 0;
for (const ranch of ranches.docs) {
  const data = ranch.data();
  if (!data.user_id) noOwner += 1;
  const memberIds = planMemberIds(data);
  if (sameList(memberIds, data.memberIds ?? []) && Array.isArray(data.memberIds)) continue;
  ranchChanges += 1;
  writer?.update(ranch.ref, { memberIds });
}
console.log(`Ranches: ${ranches.size} total, ${ranchChanges} need memberIds, ${noOwner} have no user_id (only readable by nobody after strict rules)`);

for (const name of RANCH_COLLECTIONS) {
  const snap = await db.collection(name).get();
  let missing = 0;
  let fixable = 0;
  for (const doc of snap.docs) {
    const data = doc.data();
    if (data.ranch_id) continue;
    missing += 1;
    const parent = data[PARENT_FIELD[name]];
    const ranchId = parent ? (await parent.get()).get('ranch_id') : undefined;
    if (!ranchId) continue;
    fixable += 1;
    writer?.update(doc.ref, { ranch_id: ranchId });
  }
  console.log(`${name}: ${snap.size} docs, ${missing} without ranch_id, ${fixable} fixable from parent, ${missing - fixable} orphaned`);
}
await writer?.close();
