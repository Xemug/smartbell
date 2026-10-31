// Regression tests for firestore.rules (final) and firestore.stage1.rules.
import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';
import { after, before, beforeEach, describe, test } from 'node:test';
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import {
  arrayRemove, arrayUnion, collection, collectionGroup, deleteDoc, doc, getDoc, getDocs,
  query, setDoc, updateDoc, where, writeBatch,
} from 'firebase/firestore';
import { stage1From } from '../scripts/build-stage1-rules.mjs';
import { INVITED, MEMBER, OTHER_OWNER, OWNER, STRANGER, db, envFor, seed } from './helpers.mjs';

const ranchA = (f) => doc(f, 'Ranches', 'ranch-a');
const cowsOf = (f) => query(collection(f, 'Cows'), where('ranch_id', '==', ranchA(f)));

test('firestore.stage1.rules is generated from firestore.rules', () => {
  const read = (name) => readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');
  assert.equal(read('firestore.stage1.rules'), stage1From(read('firestore.rules')));
});

describe('final rules', () => {
  let env;
  before(async () => { env = await envFor(process.env.FINAL_RULES ?? 'firestore.rules'); });
  after(() => env.cleanup());
  beforeEach(() => seed(env));

  describe('ranch data', () => {
    test('a non-member cannot read another ranch', async () => {
      const f = db(env, STRANGER);
      await assertFails(getDocs(cowsOf(f)));
      await assertFails(getDoc(doc(f, 'Cows', 'cow-a')));
      await assertFails(getDoc(doc(f, 'Tasks', 'task-a')));
      await assertFails(getDoc(ranchA(f)));
      await assertFails(getDocs(collection(ranchA(f), 'productionPerDays')));
      await assertFails(getDocs(query(collectionGroup(f, 'productionPerDays'), where('ranch_id', '==', ranchA(f)))));
    });

    test('a non-member cannot write or delete another ranch', async () => {
      const f = db(env, STRANGER);
      await assertFails(updateDoc(doc(f, 'Cows', 'cow-a'), { name: 'x' }));
      await assertFails(deleteDoc(doc(f, 'Cows', 'cow-a')));
      await assertFails(setDoc(doc(f, 'Cows', 'new'), { ranch_id: ranchA(f) }));
      await assertFails(updateDoc(ranchA(f), { ranch_name: 'x' }));
      await assertFails(deleteDoc(ranchA(f)));
      await assertFails(setDoc(doc(ranchA(f), 'productionPerDays', 'd2'), { ranch_id: ranchA(f) }));
    });

    test('an unsigned client gets nothing', async () => {
      const f = db(env, null);
      await assertFails(getDoc(doc(f, 'Cows', 'cow-a')));
      await assertFails(getDoc(doc(f, 'Users', OWNER)));
      await assertFails(getDocs(collection(f, 'Users')));
    });

    test('an unscoped query is refused even for a member', async () => {
      await assertFails(getDocs(collection(db(env, MEMBER), 'Cows')));
    });

    test('a user cannot claim membership through their own ranch_list', async () => {
      const f = db(env, STRANGER);
      await assertSucceeds(updateDoc(doc(f, 'Users', STRANGER), { ranch_list: arrayUnion(ranchA(f)) }));
      await assertFails(getDocs(cowsOf(f)));
    });

    test('ranch_id cannot point at a doc the caller controls', async () => {
      const f = db(env, STRANGER);
      // A Users doc the caller owns, shaped like a ranch they "own".
      await assertSucceeds(updateDoc(doc(f, 'Users', STRANGER), { user_id: doc(f, 'Users', STRANGER) }));
      await assertFails(setDoc(doc(f, 'Cows', 'fake'), { ranch_id: doc(f, 'Users', STRANGER) }));
    });

    for (const uid of [OWNER, MEMBER]) {
      test(`${uid} can read, write and delete ranch data`, async () => {
        const f = db(env, uid);
        await assertSucceeds(getDocs(cowsOf(f)));
        await assertSucceeds(getDoc(doc(f, 'Cows', 'cow-a')));
        await assertSucceeds(setDoc(doc(f, 'Cows', 'cow-new'), { name: 'n', ranch_id: ranchA(f) }));
        await assertSucceeds(updateDoc(doc(f, 'Cows', 'cow-a'), { name: 'renamed' }));
        await assertSucceeds(deleteDoc(doc(f, 'Cows', 'cow-a')));
        await assertSucceeds(deleteDoc(doc(f, 'Tasks', 'task-a')));
        await assertSucceeds(getDocs(collection(ranchA(f), 'productionPerDays')));
        await assertSucceeds(getDocs(query(collectionGroup(f, 'productionPerDays'), where('ranch_id', '==', ranchA(f)))));
        await assertSucceeds(setDoc(doc(ranchA(f), 'productionPerDays', 'd2'), { ranch_id: ranchA(f) }));
      });
    }

    test('a member cannot move a doc to another ranch', async () => {
      const f = db(env, MEMBER);
      await assertFails(updateDoc(doc(f, 'Cows', 'cow-a'), { ranch_id: doc(f, 'Ranches', 'ranch-b') }));
    });

    test('a member cannot create a doc in another ranch', async () => {
      const f = db(env, MEMBER);
      await assertFails(setDoc(doc(f, 'Cows', 'x'), { ranch_id: doc(f, 'Ranches', 'ranch-b') }));
    });

    test('a doc without ranch_id is refused', async () => {
      const f = db(env, MEMBER);
      await assertFails(setDoc(doc(f, 'BullWeightHeight', 'x'), { weight: 1 }));
    });

    test('a 200-document batch stays inside the rules get() limit', async () => {
      const f = db(env, MEMBER);
      const batch = writeBatch(f);
      for (let i = 0; i < 200; i += 1) batch.set(doc(f, 'Cows', `bulk-${i}`), { ranch_id: ranchA(f) });
      await assertSucceeds(batch.commit());
    });
  });

  describe('Ranches doc', () => {
    test('only the owner can delete a ranch', async () => {
      await assertFails(deleteDoc(ranchA(db(env, MEMBER))));
      await assertFails(deleteDoc(ranchA(db(env, INVITED))));
      await assertSucceeds(deleteDoc(ranchA(db(env, OWNER))));
    });

    test('owner, member and invited user can read the ranch doc', async () => {
      for (const uid of [OWNER, MEMBER, INVITED]) await assertSucceeds(getDoc(ranchA(db(env, uid))));
    });

    test('a deleted ranch id cannot be claimed again', async () => {
      await env.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'deletedRanches', 'gone'), { deletedAt: 1 });
      });
      const f = db(env, STRANGER);
      await assertFails(setDoc(doc(f, 'Ranches', 'gone'), { user_id: doc(f, 'Users', STRANGER) }));
      await assertFails(getDoc(doc(f, 'deletedRanches', 'gone')));
    });

    test('the app ranch queries work', async () => {
      const me = (f, uid) => doc(f, 'Users', uid);
      let f = db(env, OWNER);
      await assertSucceeds(getDocs(query(collection(f, 'Ranches'), where('user_id', '==', me(f, OWNER)))));
      f = db(env, INVITED);
      await assertSucceeds(getDocs(query(collection(f, 'Ranches'), where('invitedUsers', 'array-contains', me(f, INVITED)))));
      f = db(env, MEMBER);
      await assertSucceeds(getDocs(query(collection(f, 'Ranches'), where('memberIds', 'array-contains', MEMBER))));
    });

    test('nobody can list ranches they are not in', async () => {
      await assertFails(getDocs(collection(db(env, STRANGER), 'Ranches')));
      const f = db(env, STRANGER);
      await assertFails(getDocs(query(collection(f, 'Ranches'), where('user_id', '==', doc(f, 'Users', OWNER)))));
    });

    test('a user can only create a ranch they own', async () => {
      const f = db(env, STRANGER);
      await assertSucceeds(setDoc(doc(f, 'Ranches', 'mine'), { user_id: doc(f, 'Users', STRANGER), ranch_name: 'm' }));
      await assertFails(setDoc(doc(f, 'Ranches', 'theirs'), { user_id: doc(f, 'Users', OWNER) }));
      await assertFails(setDoc(doc(f, 'Ranches', 'seeded'), { user_id: doc(f, 'Users', STRANGER), memberIds: ['x'] }));
    });

    test('a member can update counters but not ownership or the people lists', async () => {
      const f = db(env, MEMBER);
      await assertSucceeds(updateDoc(ranchA(f), { total_cows: 2 }));
      await assertFails(updateDoc(ranchA(f), { user_id: doc(f, 'Users', MEMBER) }));
      await assertFails(updateDoc(ranchA(f), { memberIds: arrayUnion(STRANGER) }));
      await assertFails(updateDoc(ranchA(f), { invitedUsers: arrayUnion(doc(f, 'Users', STRANGER)) }));
      await assertFails(updateDoc(ranchA(f), { workesList: [] }));
    });

    test('a member cannot file production records under another ranch', async () => {
      const f = db(env, MEMBER);
      await assertFails(setDoc(doc(ranchA(f), 'productionPerDays', 'forged'), { ranch_id: doc(f, 'Ranches', 'ranch-b') }));
      await assertFails(updateDoc(doc(ranchA(f), 'productionPerDays', 'day-1'), { ranch_id: doc(f, 'Ranches', 'ranch-b') }));
      await assertSucceeds(updateDoc(doc(ranchA(f), 'productionPerDays', 'day-1'), { total: 11 }));
    });

    test('owners cannot skip the invite function', async () => {
      const f = db(env, OWNER);
      await assertFails(updateDoc(ranchA(f), { invitedUsers: arrayUnion(doc(f, 'Users', STRANGER)) }));
      await assertFails(setDoc(doc(f, 'Ranches', 'r2'), { user_id: doc(f, 'Users', OWNER), invitedUsers: [doc(f, 'Users', STRANGER)] }));
      await assertSucceeds(updateDoc(ranchA(f), { invitedUsers: arrayRemove(doc(f, 'Users', INVITED)) }));
    });

    test('the owner can remove a member but cannot add one or transfer the ranch', async () => {
      const f = db(env, OWNER);
      await assertFails(updateDoc(ranchA(f), { memberIds: arrayUnion(STRANGER) }));
      await assertFails(updateDoc(ranchA(f), { user_id: doc(f, 'Users', STRANGER) }));
      await assertSucceeds(updateDoc(ranchA(f), { memberIds: arrayRemove(MEMBER) }));
    });
  });

  describe('invites', () => {
    const accept = (f, uid) => updateDoc(ranchA(f), {
      memberIds: arrayUnion(uid),
      invitedUsers: arrayRemove(doc(f, 'Users', uid)),
    });

    test('an invited user sees the ranch doc but no animals or production before accepting', async () => {
      const f = db(env, INVITED);
      await assertSucceeds(getDoc(ranchA(f)));
      await assertFails(getDocs(cowsOf(f)));
      await assertFails(getDoc(doc(f, 'Cows', 'cow-a')));
      await assertFails(getDocs(collection(ranchA(f), 'productionPerDays')));
      await assertFails(setDoc(doc(f, 'Cows', 'x'), { ranch_id: ranchA(f) }));
    });

    test('accepting makes the user a member', async () => {
      const f = db(env, INVITED);
      await assertSucceeds(accept(f, INVITED));
      await assertSucceeds(getDocs(cowsOf(f)));
    });

    test('a backfilled member can still clear their old invite with the same tap', async () => {
      await env.withSecurityRulesDisabled(async (ctx) => {
        await updateDoc(ranchA(ctx.firestore()), { memberIds: arrayUnion(INVITED) });
      });
      await assertSucceeds(accept(db(env, INVITED), INVITED));
    });

    test('a stranger cannot accept, or add themselves as invited', async () => {
      const f = db(env, STRANGER);
      await assertFails(accept(f, STRANGER));
      await assertFails(updateDoc(ranchA(f), { invitedUsers: arrayUnion(doc(f, 'Users', STRANGER)) }));
    });

    test('accepting cannot add someone else or change anything else', async () => {
      const f = db(env, INVITED);
      await assertFails(accept(f, STRANGER));
      await assertFails(updateDoc(ranchA(f), {
        memberIds: arrayUnion(INVITED, STRANGER),
        invitedUsers: arrayRemove(doc(f, 'Users', INVITED)),
      }));
      await assertFails(updateDoc(ranchA(f), {
        memberIds: arrayUnion(INVITED),
        invitedUsers: arrayRemove(doc(f, 'Users', INVITED)),
        ranch_name: 'mine now',
      }));
    });
  });

  describe('Users', () => {
    test('a client can only create its own doc', async () => {
      await assertFails(setDoc(doc(db(env, null), 'Users', 'new-uid'), { uid: 'new-uid' }));
      await assertFails(setDoc(doc(db(env, STRANGER), 'Users', 'new-uid'), { uid: 'new-uid' }));
      await assertSucceeds(setDoc(doc(db(env, 'new-uid'), 'Users', 'new-uid'), { uid: 'new-uid', email: 'n@example.test' }));
    });

    test('a client cannot set premium', async () => {
      await assertFails(setDoc(doc(db(env, 'new-uid'), 'Users', 'new-uid'), { premium: true }));
      await assertFails(setDoc(doc(db(env, 'new-uid'), 'Users', 'new-uid'), { lifetimeMember: true }));
      const own = doc(db(env, STRANGER), 'Users', STRANGER);
      await assertFails(updateDoc(own, { premium: true }));
      await assertFails(updateDoc(own, { lifetimeMember: true }));
    });

    test('a client can edit the rest of its own doc', async () => {
      await assertSucceeds(updateDoc(doc(db(env, STRANGER), 'Users', STRANGER), { currentSelectedRanch: null, onboarding: true }));
    });

    test('users read only their own doc, and nobody can list or search users', async () => {
      const f = db(env, STRANGER);
      await assertSucceeds(getDoc(doc(f, 'Users', STRANGER)));
      await assertFails(getDoc(doc(f, 'Users', OWNER)));
      await assertFails(getDocs(collection(f, 'Users')));
      await assertFails(getDocs(query(collection(f, 'Users'), where('email', '==', 'owner-uid@example.test'))));
    });

    test('a client cannot write another user doc or delete any', async () => {
      const f = db(env, STRANGER);
      await assertFails(updateDoc(doc(f, 'Users', OWNER), { userName: 'x' }));
      await assertFails(deleteDoc(doc(f, 'Users', STRANGER)));
    });

    test('invite throttle counters are not client readable', async () => {
      await assertFails(getDoc(doc(db(env, OWNER), 'inviteThrottle', OWNER)));
    });
  });
});

describe('stage 1 rules (today\'s app versions)', () => {
  let env;
  before(async () => { env = await envFor('firestore.stage1.rules'); });
  after(() => env.cleanup());
  beforeEach(() => seed(env));

  test('cross-ranch writes and deletes are closed', async () => {
    const f = db(env, STRANGER);
    await assertFails(updateDoc(doc(f, 'Cows', 'cow-a'), { name: 'x' }));
    await assertFails(deleteDoc(doc(f, 'Cows', 'cow-a')));
    await assertFails(setDoc(doc(f, 'Cows', 'new'), { ranch_id: ranchA(f) }));
    await assertFails(updateDoc(ranchA(f), { ranch_name: 'x' }));
    await assertFails(deleteDoc(ranchA(f)));
    await assertFails(setDoc(doc(f, 'Users', 'someone'), { uid: 'someone' }));
  });

  test('old app reads keep working: unscoped queries and email lookup', async () => {
    const f = db(env, MEMBER);
    await assertSucceeds(getDocs(collection(f, 'Cows')));
    await assertSucceeds(getDocs(collection(f, 'Ranches')));
    await assertSucceeds(getDocs(query(collection(f, 'Users'), where('email', '==', 'owner-uid@example.test'))));
  });

  test('an invited user on the old app can still work in the ranch', async () => {
    const f = db(env, INVITED);
    await assertSucceeds(updateDoc(doc(f, 'Cows', 'cow-a'), { name: 'ok' }));
    await assertSucceeds(updateDoc(ranchA(f), { total_cows: 3 }));
  });

  test('the old client premium write after a purchase still succeeds', async () => {
    await assertSucceeds(updateDoc(doc(db(env, STRANGER), 'Users', STRANGER), { premium: true }));
  });

  test('the old direct invite write still works', async () => {
    const f = db(env, OWNER);
    await assertSucceeds(updateDoc(ranchA(f), { invitedUsers: arrayUnion(doc(f, 'Users', STRANGER)) }));
  });

  test('the old log forms, which write no ranch_id, still work for members', async () => {
    const f = db(env, MEMBER);
    await assertSucceeds(setDoc(doc(f, 'BullWeightHeight', 'b'), { weight: 1, bull_id: doc(f, 'Bulls', 'bull-a') }));
    await assertSucceeds(setDoc(doc(f, 'cowProductionPerDay', 'c'), { cow_id: doc(f, 'Cows', 'cow-a') }));
  });

  test('a log with both parents is refused, so the backfill cannot stamp the wrong ranch', async () => {
    const f = db(env, MEMBER);
    await assertFails(setDoc(doc(f, 'BullWeightHeight', 'x'), { cow_id: doc(f, 'Cows', 'cow-a'), bull_id: doc(f, 'Bulls', 'bull-a') }));
  });

  test('the old edit form can add ranch_id to a log that had none', async () => {
    const f = db(env, MEMBER);
    await assertSucceeds(setDoc(doc(f, 'cowProductionPerDay', 'c'), { cow_id: doc(f, 'Cows', 'cow-a') }));
    await assertSucceeds(updateDoc(doc(f, 'cowProductionPerDay', 'c'), { ranch_id: ranchA(f) }));
    await assertFails(setDoc(doc(f, 'cowProductionPerDay', 'd'), { cow_id: doc(f, 'Cows', 'cow-a') }).then(() => updateDoc(doc(f, 'cowProductionPerDay', 'd'), { ranch_id: doc(f, 'Ranches', 'ranch-b') })));
  });

  test('a stranger cannot file a log with no ranch_id against another ranch animal', async () => {
    const f = db(env, STRANGER);
    await assertFails(setDoc(doc(f, 'cowHealth', 'c'), { cow_id: doc(f, 'Cows', 'cow-a') }));
    await assertFails(setDoc(doc(f, 'BullWeightHeight', 'b'), { bull_id: doc(f, 'Bulls', 'bull-a') }));
    await assertFails(setDoc(doc(f, 'cowHealth', 'd'), { cow_id: doc(f, 'Users', STRANGER) }));
    await assertFails(setDoc(doc(f, 'cowHealth', 'e'), { note: 'no parent at all' }));
  });

  test('ranch_id cannot be dropped to escape the check', async () => {
    const f = db(env, STRANGER);
    await assertFails(setDoc(doc(f, 'Cows', 'cow-a'), { name: 'wiped' }));
  });
});
