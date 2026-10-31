// Logic for the lockdown functions. index.js wires it to Firebase; tests call it directly.
const { createHash, timingSafeEqual } = require('node:crypto');
const { FieldValue } = require('firebase-admin/firestore');
const { planRanch } = require('./ranch-plan');

const INVITE_LIMIT_PER_HOUR = 20;
// Higher than invites because someone entering a herd by hand checks one number per animal.
const SINIIGA_LIMIT_PER_HOUR = 60;
const HOUR_MS = 60 * 60 * 1000;
const WORKER_STATUSES = ['Active', 'Activo'];
const PREMIUM_ENTITLEMENT = 'Pro';
const SINIIGA_FORMAT = /^484-00-(\d{2})-\d{4}-\d{4}$/;
const isDocId = (id) => typeof id === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(id);

class CallError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

async function takeSlot(db, docId, limit, message, now) {
  const ref = db.collection('inviteThrottle').doc(docId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const current = snap.data();
    const fresh = !current || now - current.windowStart >= HOUR_MS;
    const count = fresh ? 0 : current.count;
    if (count >= limit) throw new CallError('resource-exhausted', message);
    tx.set(ref, { windowStart: fresh ? now : current.windowStart, count: count + 1 });
  });
}

/**
 * Invites a user to the caller's ranch by email.
 *
 * Replaces the client lookup and the client write to the invitee's doc. The email is
 * resolved through Firebase Auth, not Users.email, because users can edit their own
 * Users doc and could otherwise intercept an invite meant for someone else.
 * The response is only a status: no uid, name or other profile data.
 */
async function inviteUser(db, auth, callerUid, data, now = Date.now()) {
  if (!callerUid) throw new CallError('unauthenticated', 'Sign in first.');
  const { ranchId, email, rol, status = 'Active' } = data ?? {};
  if (!isDocId(ranchId) || typeof email !== 'string' || email.length > 254 || !email.includes('@')) {
    throw new CallError('invalid-argument', 'Invalid invite.');
  }
  if (typeof rol !== 'string' || rol.length < 1 || rol.length > 60 || !WORKER_STATUSES.includes(status)) {
    throw new CallError('invalid-argument', 'Invalid invite.');
  }

  await takeSlot(db, callerUid, INVITE_LIMIT_PER_HOUR, 'Too many invites. Try again later.', now);

  const ranchRef = db.collection('Ranches').doc(ranchId);
  const callerRef = db.collection('Users').doc(callerUid);
  const [ranch, caller] = await Promise.all([ranchRef.get(), callerRef.get()]);
  // One error for missing and not-yours, so callers can't probe which ranches exist.
  if (!ranch.exists || ranch.get('user_id')?.path !== callerRef.path) {
    throw new CallError('permission-denied', 'Only the ranch owner can invite.');
  }
  if (caller.get('premium') !== true) throw new CallError('failed-precondition', 'Inviting users is a premium feature.');

  let invitee;
  try {
    invitee = await auth.getUserByEmail(email.trim());
  } catch (err) {
    if (['auth/user-not-found', 'auth/invalid-email'].includes(err.code)) return { status: 'not_found' };
    throw err;
  }
  const inviteeRef = db.collection('Users').doc(invitee.uid);
  const inviteeDoc = await inviteeRef.get();
  if (!inviteeDoc.exists) return { status: 'not_found' };

  if (invitee.uid === callerUid || (ranch.get('memberIds') ?? []).includes(invitee.uid)) {
    return { status: 'already_member' };
  }
  if ((ranch.get('invitedUsers') ?? []).some((ref) => ref.path === inviteeRef.path)) {
    return { status: 'already_invited' };
  }

  await ranchRef.update({
    invitedUsers: FieldValue.arrayUnion(inviteeRef),
    workesList: FieldValue.arrayUnion({
      user: inviteeRef,
      rol,
      status,
      userName: inviteeDoc.get('userName') ?? 'user name',
    }),
  });
  return { status: 'invited' };
}

/**
 * Says whether a SINIIGA number is free across every ranch. It's a national id, and the
 * final rules can't let a client look across ranches, so the check runs here.
 *
 * The answer is only available or taken, and it's throttled because it is an existence
 * oracle. animalId only excuses an animal in the caller's own ranch: excusing any id
 * would let a caller test which number another ranch's animal holds.
 */
async function checkSiniiga(db, callerUid, data, now = Date.now()) {
  if (!callerUid) throw new CallError('unauthenticated', 'Sign in first.');
  const { siniiga, ranchId, animalId } = data ?? {};
  const format = typeof siniiga === 'string' ? SINIIGA_FORMAT.exec(siniiga) : null;
  if (!format) throw new CallError('invalid-argument', 'Invalid SINIIGA number.');
  const state = Number(format[1]);
  if (state < 1 || state > 32) throw new CallError('out-of-range', 'Invalid SINIIGA state code.');
  if (!isDocId(ranchId) || (animalId != null && !isDocId(animalId))) {
    throw new CallError('invalid-argument', 'Invalid SINIIGA check.');
  }

  await takeSlot(db, `siniiga_${callerUid}`, SINIIGA_LIMIT_PER_HOUR, 'Too many checks. Try again later.', now);

  const ranchRef = db.collection('Ranches').doc(ranchId);
  const callerPath = `Users/${callerUid}`;
  const ranch = await ranchRef.get();
  const isMember = ranch.exists
    && (ranch.get('user_id')?.path === callerPath || (ranch.get('memberIds') ?? []).includes(callerUid));
  // One error for missing and not-yours, as in inviteUser.
  if (!isMember) throw new CallError('permission-denied', 'Only ranch members can check a number.');

  const isOwnAnimal = (doc) => doc.id === animalId && doc.get('ranch_id')?.path === ranchRef.path;
  for (const name of ['Cows', 'Bulls']) {
    // Two, so a duplicate still shows when one of the matches is the animal being edited.
    const matches = await db.collection(name).where('SINIIGA', '==', siniiga).limit(2).get();
    if (matches.docs.some((doc) => !isOwnAnimal(doc))) return { status: 'taken' };
  }
  return { status: 'available' };
}

function sameSecret(given, expected) {
  const hash = (value) => createHash('sha256').update(value).digest();
  return timingSafeEqual(hash(given), hash(expected));
}

const isRealUid = (id) => typeof id === 'string' && id.length > 0 && !id.startsWith('$RCAnonymousID:');

function uidsFromEvent(event) {
  if (event.type === 'TRANSFER') {
    return [...new Set([...(event.transferred_from ?? []), ...(event.transferred_to ?? [])])].filter(isRealUid);
  }
  return [...new Set([event.app_user_id, event.original_app_user_id, ...(event.aliases ?? [])])].filter(isRealUid);
}

function isSandboxPurchase(subscriber, productId) {
  const subscription = subscriber?.subscriptions?.[productId];
  const oneTime = subscriber?.non_subscriptions?.[productId] ?? [];
  // One real purchase is enough, even if the same person also bought it while testing.
  return subscription?.is_sandbox === true
    || (oneTime.length > 0 && oneTime.every((purchase) => purchase.is_sandbox === true));
}

/** True when the RevenueCat subscriber document grants Pro right now. */
function hasActivePro(subscriber, now, allowSandbox = false) {
  const entitlement = subscriber?.entitlements?.[PREMIUM_ENTITLEMENT];
  if (!entitlement) return false;
  // A production event can arrive for a tester who also holds a sandbox purchase.
  if (!allowSandbox && isSandboxPurchase(subscriber, entitlement.product_identifier)) return false;
  if (entitlement.expires_date == null) return true; // lifetime
  const ends = [entitlement.expires_date, entitlement.grace_period_expires_date].filter(Boolean).map(Date.parse);
  return Math.max(...ends) > now;
}

/**
 * Sets Users.premium from RevenueCat's current state.
 *
 * The event only says who to look at. Trusting event types would break on retries and
 * out-of-order delivery, and on a lifetime member whose old monthly plan expires: that
 * sends EXPIRATION while they are still entitled.
 */
async function applyRevenueCatEvent(db, event, { fetchSubscriber, allowSandbox = false, now = Date.now() }) {
  if (event.type === 'TEST') return { action: 'ignored', reason: 'test event' };
  if (event.environment === 'SANDBOX' && !allowSandbox) return { action: 'ignored', reason: 'sandbox' };

  const updated = [];
  for (const uid of uidsFromEvent(event)) {
    const ref = db.collection('Users').doc(uid);
    if (!(await ref.get()).exists) continue;
    const premium = hasActivePro(await fetchSubscriber(uid), now, allowSandbox);
    // update(), never set(): this must not create a Users doc for an unknown id.
    await ref.update({ premium, premiumCheckedAt: FieldValue.serverTimestamp() });
    updated.push({ uid, premium });
  }
  return updated.length ? { action: 'updated', updated } : { action: 'ignored', reason: 'no matching user' };
}

async function handleRevenueCatWebhook(req, res, deps) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');
  if (!deps.secret) return res.status(500).send('Not configured');
  if (!sameSecret(req.get('authorization') ?? '', deps.secret)) return res.status(401).send('Unauthorized');
  const event = req.body?.event;
  if (!event || typeof event.type !== 'string') return res.status(400).send('Bad event');
  try {
    const result = await applyRevenueCatEvent(deps.db, event, deps);
    return res.status(200).json({ action: result.action });
  } catch (err) {
    // Non-2xx makes RevenueCat retry later.
    console.error('revenueCatWebhook failed', err.message);
    return res.status(500).send('Try again');
  }
}

/**
 * Keeps access in step with the ranch doc. Runs on every Ranches write.
 *
 * A deleted ranch gets a tombstone so its id can't be reclaimed. Otherwise anyone an owner
 * removed or disabled loses access: the old app only edits workesList, and this also
 * covers owners who stay on it. It only ever removes. The wait matters because the old
 * edit_user form removes the worker row and adds it back in two separate writes.
 */
async function syncRanchAccess(db, ranchId, { wait = () => Promise.resolve() } = {}) {
  const ref = db.collection('Ranches').doc(ranchId);
  await wait();
  const ranch = await ref.get();
  if (!ranch.exists) {
    await db.collection('deletedRanches').doc(ranchId).set({ deletedAt: FieldValue.serverTimestamp() });
    return;
  }
  const { removeMembers, removeInvited } = planRanch(ranch.data());
  if (!removeMembers.length && !removeInvited.length) return;
  await ref.update({
    ...(removeMembers.length ? { memberIds: FieldValue.arrayRemove(...removeMembers) } : {}),
    ...(removeInvited.length ? { invitedUsers: FieldValue.arrayRemove(...removeInvited) } : {}),
  });
}

module.exports = { CallError, checkSiniiga, syncRanchAccess, inviteUser, applyRevenueCatEvent, handleRevenueCatWebhook, hasActivePro };
