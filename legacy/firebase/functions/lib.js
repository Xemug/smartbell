// Logic for the lockdown functions. index.js wires it to Firebase; tests call it directly.
const { createHash, timingSafeEqual } = require('node:crypto');
const { FieldValue } = require('firebase-admin/firestore');

const INVITE_LIMIT_PER_HOUR = 20;
const HOUR_MS = 60 * 60 * 1000;
const WORKER_STATUSES = ['Active', 'Activo'];
const PREMIUM_ENTITLEMENT = 'Pro';

class CallError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

async function takeInviteSlot(db, uid, now) {
  const ref = db.collection('inviteThrottle').doc(uid);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const current = snap.data();
    const fresh = !current || now - current.windowStart >= HOUR_MS;
    const count = fresh ? 0 : current.count;
    if (count >= INVITE_LIMIT_PER_HOUR) throw new CallError('resource-exhausted', 'Too many invites. Try again later.');
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
  const validId = typeof ranchId === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(ranchId);
  if (!validId || typeof email !== 'string' || email.length > 254 || !email.includes('@')) {
    throw new CallError('invalid-argument', 'Invalid invite.');
  }
  if (typeof rol !== 'string' || rol.length < 1 || rol.length > 60 || !WORKER_STATUSES.includes(status)) {
    throw new CallError('invalid-argument', 'Invalid invite.');
  }

  await takeInviteSlot(db, callerUid, now);

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

/** True when the RevenueCat subscriber document grants Pro right now. */
function hasActivePro(subscriber, now) {
  const entitlement = subscriber?.entitlements?.[PREMIUM_ENTITLEMENT];
  if (!entitlement) return false;
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
    const premium = hasActivePro(await fetchSubscriber(uid), now);
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

module.exports = { CallError, inviteUser, applyRevenueCatEvent, handleRevenueCatWebhook, hasActivePro };
