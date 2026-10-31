// Drives the emulated functions over real HTTP. Run through scripts/smoke.sh.
import { createServer } from 'node:http';
import { strict as assert } from 'node:assert';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const project = 'demo-smartbell';
const base = `http://127.0.0.1:5101/${project}/us-central1`;
const app = initializeApp({ projectId: project });
const db = getFirestore(app);
const auth = getAuth(app);

let entitlements = {};
const fakeRevenueCat = createServer((_, res) => {
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ subscriber: { entitlements } }));
}).listen(5199, '127.0.0.1');

const users = db.collection('Users');
await auth.createUser({ uid: 'owner', email: 'owner@example.test', password: 'password1' });
await auth.createUser({ uid: 'worker', email: 'worker@example.test', password: 'password1' });
await users.doc('owner').set({ premium: true });
await users.doc('worker').set({ premium: false, userName: 'Worker' });
await db.collection('Ranches').doc('r1').set({ user_id: users.doc('owner'), invitedUsers: [], workesList: [] });

const webhook = (body, authorization = 'Bearer smoke') => fetch(`${base}/revenueCatWebhook`, {
  method: 'POST', headers: { 'content-type': 'application/json', authorization }, body: JSON.stringify(body),
});
const premium = async () => (await users.doc('worker').get()).get('premium');
const event = (type) => ({ event: { type, app_user_id: 'worker' } });

assert.equal((await webhook(event('INITIAL_PURCHASE'), 'Bearer wrong')).status, 401);
console.log('webhook with wrong secret: 401');

entitlements = { Pro: { expires_date: null } };
assert.equal((await webhook(event('INITIAL_PURCHASE'))).status, 200);
assert.equal(await premium(), true);
console.log('purchase event: premium true');

entitlements = {};
assert.equal((await webhook(event('EXPIRATION'))).status, 200);
assert.equal(await premium(), false);
console.log('lapse event: premium false');

const signIn = await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake`, {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email: 'owner@example.test', password: 'password1', returnSecureToken: true }),
});
const { idToken } = await signIn.json();
const invite = await fetch(`${base}/inviteUserByEmail`, {
  method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${idToken}` },
  body: JSON.stringify({ data: { ranchId: 'r1', email: 'worker@example.test', rol: 'Worker' } }),
});
const { result } = await invite.json();
assert.deepEqual(result, { status: 'invited' });
assert.deepEqual((await db.collection('Ranches').doc('r1').get()).get('invitedUsers').map((r) => r.id), ['worker']);
console.log('callable invite: ranch updated, invitee listed');

const anonymous = await fetch(`${base}/inviteUserByEmail`, {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ data: { ranchId: 'r1', email: 'worker@example.test', rol: 'Worker' } }),
});
assert.equal(anonymous.status, 401);
console.log('callable invite without sign-in: 401');

fakeRevenueCat.close();
process.exit(0);
