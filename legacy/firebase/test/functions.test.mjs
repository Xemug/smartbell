import { strict as assert } from 'node:assert';
import { createRequire } from 'node:module';
import { after, before, beforeEach, describe, test } from 'node:test';

// Resolve firebase-admin from functions/, like lib.js does. If functions/node_modules
// exists, a second copy would reject FieldValue objects made by the first.
const require = createRequire(new URL('../functions/lib.js', import.meta.url));
const { deleteApp, initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const { applyRevenueCatEvent, handleRevenueCatWebhook, hasActivePro, inviteUser } = require('./lib.js');

process.env.GCLOUD_PROJECT = 'demo-smartbell';
let app, db, auth;
const OWNER = 'fn-owner';
const USER = 'fn-user';
const NOW = Date.parse('2026-10-31T12:00:00Z');
const FUTURE = '2027-01-01T00:00:00Z';
const PAST = '2026-01-01T00:00:00Z';

async function wipe() {
  await fetch(`http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/demo-smartbell/databases/(default)/documents`, { method: 'DELETE' });
  await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/emulator/v1/projects/demo-smartbell/accounts`, {
    method: 'DELETE', headers: { Authorization: 'Bearer owner' },
  });
}

before(() => {
  app = initializeApp({ projectId: 'demo-smartbell' }, 'fn-tests');
  db = getFirestore(app);
  auth = getAuth(app);
});
after(() => deleteApp(app));

beforeEach(async () => {
  await wipe();
  await auth.createUser({ uid: OWNER, email: 'owner@example.test' });
  await auth.createUser({ uid: USER, email: 'worker@example.test' });
  const users = db.collection('Users');
  await users.doc(OWNER).set({ premium: true, email: 'owner@example.test' });
  await users.doc(USER).set({ premium: false, email: 'worker@example.test', userName: 'Worker' });
  await db.collection('Ranches').doc('r1').set({ user_id: users.doc(OWNER), memberIds: [], invitedUsers: [], workesList: [] });
});

const invite = (data, uid = OWNER, now = NOW) => inviteUser(db, auth, uid, { ranchId: 'r1', rol: 'Worker', ...data }, now);
const code = (expected) => (err) => { assert.equal(err.code, expected); return true; };

describe('inviteUser', () => {
  test('invites by email and writes only the ranch', async () => {
    assert.deepEqual(await invite({ email: 'worker@example.test' }), { status: 'invited' });
    const ranch = (await db.collection('Ranches').doc('r1').get()).data();
    assert.deepEqual(ranch.invitedUsers.map((r) => r.id), [USER]);
    assert.equal(ranch.workesList[0].user.id, USER);
    assert.equal(ranch.workesList[0].userName, 'Worker');
    assert.deepEqual(ranch.memberIds, [], 'an invite is not membership');
    assert.equal((await db.collection('Users').doc(USER).get()).get('invitedRanchesList'), undefined);
  });

  test('returns no profile data', async () => {
    assert.deepEqual(Object.keys(await invite({ email: 'worker@example.test' })), ['status']);
  });

  test('a user who sets Users.email to the victim address cannot intercept the invite', async () => {
    await auth.createUser({ uid: 'attacker', email: 'attacker@example.test' });
    await db.collection('Users').doc('attacker').set({ email: 'worker@example.test' });
    await invite({ email: 'worker@example.test' });
    const ranch = (await db.collection('Ranches').doc('r1').get()).data();
    assert.deepEqual(ranch.invitedUsers.map((r) => r.id), [USER]);
  });

  test('unknown email reports not_found and changes nothing', async () => {
    assert.deepEqual(await invite({ email: 'nobody@example.test' }), { status: 'not_found' });
    assert.deepEqual((await db.collection('Ranches').doc('r1').get()).get('invitedUsers'), []);
  });

  test('an email Auth rejects reads as not_found, not an internal error', async () => {
    assert.deepEqual(await invite({ email: 'foo@' }), { status: 'not_found' });
  });

  test('inviting twice, inviting a member and inviting yourself change nothing', async () => {
    await invite({ email: 'worker@example.test' });
    assert.equal((await invite({ email: 'worker@example.test' })).status, 'already_invited');
    assert.equal((await invite({ email: 'owner@example.test' })).status, 'already_member');
    await db.collection('Ranches').doc('r1').update({ memberIds: [USER], invitedUsers: [] });
    assert.equal((await invite({ email: 'worker@example.test' })).status, 'already_member');
  });

  test('only a signed-in premium owner can invite', async () => {
    await assert.rejects(invite({ email: 'worker@example.test' }, null), code('unauthenticated'));
    await assert.rejects(invite({ email: 'worker@example.test' }, USER), code('permission-denied'));
    await assert.rejects(inviteUser(db, auth, OWNER, { ranchId: 'missing', rol: 'x', email: 'a@b.c' }, NOW), code('permission-denied'));
    await db.collection('Users').doc(OWNER).update({ premium: false });
    await assert.rejects(invite({ email: 'worker@example.test' }), code('failed-precondition'));
  });

  test('bad input is refused', async () => {
    await assert.rejects(invite({ email: 'not-an-email' }), code('invalid-argument'));
    await assert.rejects(invite({ email: 'a@b.c', rol: '' }), code('invalid-argument'));
    await assert.rejects(invite({ email: 'a@b.c', status: 'Owner' }), code('invalid-argument'));
    await assert.rejects(invite({ email: 'a@b.c', ranchId: '../Users/x' }), code('invalid-argument'));
  });

  test('email probing is rate limited, and the window resets', async () => {
    for (let i = 0; i < 20; i += 1) await invite({ email: `n${i}@example.test` });
    await assert.rejects(invite({ email: 'n21@example.test' }), code('resource-exhausted'));
    assert.equal((await invite({ email: 'n22@example.test' }, OWNER, NOW + 3600_000)).status, 'not_found');
  });
});

describe('hasActivePro', () => {
  test('reads the Pro entitlement only', () => {
    assert.equal(hasActivePro({ entitlements: { Pro: { expires_date: FUTURE } } }, NOW), true);
    assert.equal(hasActivePro({ entitlements: { Pro: { expires_date: null } } }, NOW), true, 'lifetime');
    assert.equal(hasActivePro({ entitlements: { Pro: { expires_date: PAST } } }, NOW), false);
    assert.equal(hasActivePro({ entitlements: { Pro: { expires_date: PAST, grace_period_expires_date: FUTURE } } }, NOW), true);
    assert.equal(hasActivePro({ entitlements: { User: { expires_date: null } } }, NOW), false, 'seat product');
    assert.equal(hasActivePro({ entitlements: {} }, NOW), false);
  });

  test('a sandbox purchase counts only when sandbox is allowed', () => {
    const entitlements = { Pro: { expires_date: FUTURE, product_identifier: 'm' } };
    const subscription = { entitlements, subscriptions: { m: { is_sandbox: true } } };
    assert.equal(hasActivePro(subscription, NOW), false);
    assert.equal(hasActivePro(subscription, NOW, true), true);
    const oneTime = { entitlements: { Pro: { expires_date: null, product_identifier: 'l' } }, non_subscriptions: { l: [{ is_sandbox: true }] } };
    assert.equal(hasActivePro(oneTime, NOW), false);
    assert.equal(hasActivePro({ entitlements, subscriptions: { m: { is_sandbox: false } } }, NOW), true);
  });
});

describe('RevenueCat', () => {
  const premium = async (uid = USER) => (await db.collection('Users').doc(uid).get()).get('premium');
  const apply = (event, subscriber, opts = {}) =>
    applyRevenueCatEvent(db, event, { fetchSubscriber: async () => subscriber, now: NOW, ...opts });

  test('a purchase sets premium', async () => {
    await apply({ type: 'INITIAL_PURCHASE', app_user_id: USER }, { entitlements: { Pro: { expires_date: FUTURE } } });
    assert.equal(await premium(), true);
  });

  test('a lapse clears premium', async () => {
    await db.collection('Users').doc(USER).update({ premium: true });
    await apply({ type: 'EXPIRATION', app_user_id: USER }, { entitlements: { Pro: { expires_date: PAST } } });
    assert.equal(await premium(), false);
  });

  test('a refund clears premium', async () => {
    await db.collection('Users').doc(USER).update({ premium: true });
    await apply({ type: 'CANCELLATION', cancel_reason: 'CUSTOMER_SUPPORT', app_user_id: USER }, { entitlements: {} });
    assert.equal(await premium(), false);
  });

  test('turning off renewal keeps premium until the period ends', async () => {
    await db.collection('Users').doc(USER).update({ premium: true });
    await apply({ type: 'CANCELLATION', cancel_reason: 'UNSUBSCRIBE', app_user_id: USER }, { entitlements: { Pro: { expires_date: FUTURE } } });
    assert.equal(await premium(), true);
  });

  test('an old plan expiring does not clear a lifetime member', async () => {
    await db.collection('Users').doc(USER).update({ premium: true });
    await apply({ type: 'EXPIRATION', app_user_id: USER }, { entitlements: { Pro: { expires_date: null } } });
    assert.equal(await premium(), true);
  });

  test('a late, out-of-order purchase event cannot restore a lapsed user', async () => {
    await apply({ type: 'RENEWAL', app_user_id: USER }, { entitlements: { Pro: { expires_date: PAST } } });
    assert.equal(await premium(), false);
  });

  test('a transfer updates both accounts', async () => {
    await db.collection('Users').doc(OWNER).update({ premium: true });
    const subs = { [OWNER]: { entitlements: {} }, [USER]: { entitlements: { Pro: { expires_date: FUTURE } } } };
    await applyRevenueCatEvent(db, { type: 'TRANSFER', transferred_from: [OWNER], transferred_to: [USER] }, {
      fetchSubscriber: async (uid) => subs[uid], now: NOW,
    });
    assert.equal(await premium(OWNER), false);
    assert.equal(await premium(USER), true);
  });

  test('anonymous ids are skipped and aliases are followed', async () => {
    const seen = [];
    await applyRevenueCatEvent(db, { type: 'INITIAL_PURCHASE', app_user_id: '$RCAnonymousID:abc', aliases: ['$RCAnonymousID:abc', USER] }, {
      fetchSubscriber: async (uid) => { seen.push(uid); return { entitlements: { Pro: { expires_date: FUTURE } } }; }, now: NOW,
    });
    assert.deepEqual(seen, [USER]);
    assert.equal(await premium(), true);
  });

  test('an unknown user is ignored and no doc is created', async () => {
    const r = await apply({ type: 'INITIAL_PURCHASE', app_user_id: 'ghost' }, { entitlements: {} });
    assert.equal(r.action, 'ignored');
    assert.equal((await db.collection('Users').doc('ghost').get()).exists, false);
  });

  test('sandbox events are ignored unless allowed', async () => {
    const pro = { entitlements: { Pro: { expires_date: FUTURE } } };
    await apply({ type: 'INITIAL_PURCHASE', environment: 'SANDBOX', app_user_id: USER }, pro);
    assert.equal(await premium(), false);
    await apply({ type: 'INITIAL_PURCHASE', environment: 'SANDBOX', app_user_id: USER }, pro, { allowSandbox: true });
    assert.equal(await premium(), true);
  });
});

describe('revenueCatWebhook HTTP', () => {
  const deps = () => ({
    db, secret: 'Bearer s3cret', now: NOW,
    fetchSubscriber: async () => ({ entitlements: { Pro: { expires_date: FUTURE } } }),
  });
  const call = async (req, d = deps()) => {
    const res = { code: 0, status(c) { this.code = c; return this; }, send() { return this; }, json() { return this; } };
    await handleRevenueCatWebhook({ method: 'POST', get: () => 'Bearer s3cret', body: { event: { type: 'RENEWAL', app_user_id: USER } }, ...req }, res, d);
    return res.code;
  };

  test('the correct secret is accepted', async () => assert.equal(await call({}), 200));
  test('a wrong or missing secret is refused and changes nothing', async () => {
    assert.equal(await call({ get: () => 'Bearer nope' }), 401);
    assert.equal(await call({ get: () => undefined }), 401);
    assert.equal((await db.collection('Users').doc(USER).get()).get('premium'), false);
  });
  test('it fails closed when the secret is not configured', async () => assert.equal(await call({}, { ...deps(), secret: '' }), 500));
  test('GET and malformed bodies are refused', async () => {
    assert.equal(await call({ method: 'GET' }), 405);
    assert.equal(await call({ body: {} }), 400);
  });
  test('a RevenueCat outage returns 500 so the event is retried', async () => {
    const d = { ...deps(), fetchSubscriber: async () => { throw new Error('down'); } };
    assert.equal(await call({}, d), 500);
  });
});
