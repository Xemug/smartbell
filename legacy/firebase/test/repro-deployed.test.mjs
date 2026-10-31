// Reproduces the reported bugs against the model of the deployed rules. Each test
// asserts today's bad behaviour, so a failure here means the model no longer matches.
import { after, before, beforeEach, test } from 'node:test';
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { arrayUnion, collection, deleteDoc, doc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { MEMBER, OWNER, STRANGER, db, envFor, seed } from './helpers.mjs';

let env;
before(async () => { env = await envFor('firestore.deployed-model.rules'); });
after(() => env.cleanup());
beforeEach(() => seed(env));

test('any signed-up user can read every user email and phone', async () => {
  await assertSucceeds(getDocs(collection(db(env, STRANGER), 'Users')));
});

test('anyone can create a Users doc for another uid', async () => {
  await assertSucceeds(setDoc(doc(db(env, null), 'Users', 'someone-else'), { premium: true }));
});

test('a user can set premium on their own doc', async () => {
  await assertSucceeds(updateDoc(doc(db(env, STRANGER), 'Users', STRANGER), { premium: true }));
});

test('a stranger can read, edit and delete another ranch', async () => {
  const f = db(env, STRANGER);
  await assertSucceeds(getDocs(query(collection(f, 'Cows'), where('ranch_id', '==', doc(f, 'Ranches', 'ranch-a')))));
  await assertSucceeds(updateDoc(doc(f, 'Cows', 'cow-a'), { name: 'stolen' }));
  await assertSucceeds(deleteDoc(doc(f, 'Ranches', 'ranch-a')));
});

test('INVITE FAILURE: the ranch updates, then the write to the invitee doc is refused', async () => {
  const f = db(env, OWNER);
  const invitee = doc(f, 'Users', MEMBER);
  // Same order as invite_user_widget.dart: ranch first, then the invitee's Users doc.
  await assertSucceeds(updateDoc(doc(f, 'Ranches', 'ranch-a'), { invitedUsers: arrayUnion(invitee) }));
  await assertFails(updateDoc(invitee, { invitedRanchesList: arrayUnion(doc(f, 'Ranches', 'ranch-a')) }));
});
