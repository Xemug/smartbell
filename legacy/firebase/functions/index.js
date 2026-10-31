// Deployed as a separate codebase ("lockdown") so FlutterFlow's own deploy leaves it alone.
const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { defineBoolean, defineSecret } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const { CallError, checkSiniiga, inviteUser, handleRevenueCatWebhook, syncRanchAccess } = require('./lib');

initializeApp();

const webhookAuth = defineSecret('REVENUECAT_WEBHOOK_AUTH');
const revenueCatKey = defineSecret('REVENUECAT_SECRET_KEY');
const allowSandbox = defineBoolean('REVENUECAT_ALLOW_SANDBOX', { default: false });

const callable = (handler) => onCall(async (request) => {
  try {
    return await handler(request);
  } catch (err) {
    if (err instanceof CallError) throw new HttpsError(err.code, err.message);
    throw err;
  }
});

exports.inviteUserByEmail = callable((request) =>
  inviteUser(getFirestore(), getAuth(), request.auth?.uid, request.data));

exports.checkSiniiga = callable((request) =>
  checkSiniiga(getFirestore(), request.auth?.uid, request.data));

exports.onRanchChanged = onDocumentWritten('Ranches/{ranchId}', (event) =>
  syncRanchAccess(getFirestore(), event.params.ranchId, {
    wait: () => new Promise((resolve) => { setTimeout(resolve, 5000); }),
  }),
);

async function fetchSubscriber(uid) {
  const url = process.env.REVENUECAT_API_URL ?? 'https://api.revenuecat.com';
  const res = await fetch(`${url}/v1/subscribers/${encodeURIComponent(uid)}`, {
    headers: { Authorization: `Bearer ${revenueCatKey.value()}` },
  });
  if (!res.ok) throw new Error(`RevenueCat returned ${res.status}`);
  return (await res.json()).subscriber;
}

exports.revenueCatWebhook = onRequest({ secrets: [webhookAuth, revenueCatKey] }, (req, res) =>
  handleRevenueCatWebhook(req, res, {
    db: getFirestore(),
    secret: webhookAuth.value(),
    allowSandbox: allowSandbox.value(),
    fetchSubscriber,
  }),
);
