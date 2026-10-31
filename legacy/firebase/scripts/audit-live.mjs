// Read-only checks. Prints counts, field names and uids of mismatches: no emails, phones or keys.
//   Tamper check:  REVENUECAT_V2_KEY=<read-only key> node scripts/audit-live.mjs --project smartbell-app-2025 --tamper
//   Algolia check: ALGOLIA_APP_ID=... ALGOLIA_SEARCH_KEY=... node scripts/audit-live.mjs --algolia
// The tamper check uses RevenueCat's v2 API because v1 GET creates a customer that
// doesn't exist, and this script must not write.
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: { project: { type: 'string' }, tamper: { type: 'boolean' }, algolia: { type: 'boolean' }, 'rc-project': { type: 'string', default: 'projca1c5dee' } },
});

async function hasPro(uid, key) {
  const url = `https://api.revenuecat.com/v2/projects/${values['rc-project']}/customers/${encodeURIComponent(uid)}/active_entitlements`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
  if (res.status === 404) return false;
  if (!res.ok) throw new Error(`RevenueCat returned ${res.status}`);
  const body = await res.json();
  return body.items.some((e) => e.entitlement_id === 'entl8430a09a59'); // Pro
}

async function tamperCheck() {
  const { applicationDefault, initializeApp } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');
  if (!values.project || !process.env.REVENUECAT_V2_KEY) throw new Error('Needs --project and REVENUECAT_V2_KEY.');
  const db = getFirestore(initializeApp({ credential: applicationDefault(), projectId: values.project }));
  const premium = await db.collection('Users').where('premium', '==', true).get();
  const mismatches = [];
  for (const user of premium.docs) {
    if (!(await hasPro(user.id, process.env.REVENUECAT_V2_KEY))) mismatches.push(user.id);
    await new Promise((resolve) => { setTimeout(resolve, 250); }); // stay under the rate limit
  }
  console.log(`premium=true users: ${premium.size}`);
  console.log(`with active Pro in RevenueCat: ${premium.size - mismatches.length}`);
  console.log(`no active Pro (tampered, lapsed or refunded): ${mismatches.length}`);
  for (const uid of mismatches) console.log(`  ${uid}`);
}

async function algoliaCheck() {
  const { ALGOLIA_APP_ID: id, ALGOLIA_SEARCH_KEY: key } = process.env;
  if (!id || !key) throw new Error('Needs ALGOLIA_APP_ID and ALGOLIA_SEARCH_KEY.');
  const headers = { 'X-Algolia-Application-Id': id, 'X-Algolia-API-Key': key };
  const keyInfo = await fetch(`https://${id}-dsn.algolia.net/1/keys/${key}`, { headers });
  if (keyInfo.ok) {
    const info = await keyInfo.json();
    console.log(`Key ACL: ${info.acl}; restricted indexes: ${info.indexes ?? 'none'}; query parameters: ${info.queryParameters ? 'set' : 'none'}`);
  } else console.log(`Key details not readable (${keyInfo.status})`);
  for (const index of ['Cows', 'Bulls', 'Tasks']) {
    const res = await fetch(`https://${id}-dsn.algolia.net/1/indexes/${index}/query`, {
      method: 'POST', headers, body: JSON.stringify({ query: '', hitsPerPage: 1000 }),
    });
    if (!res.ok) { console.log(`${index}: not searchable with this key (${res.status})`); continue; }
    const { nbHits, hits } = await res.json();
    const fields = [...new Set(hits.flatMap(Object.keys))].sort();
    const ranches = new Set(hits.map((hit) => hit.ranch_id).filter(Boolean));
    console.log(`${index}: ${nbHits} records; ${ranches.size} distinct ranch_id in first ${hits.length}; fields: ${fields.join(', ')}`);
  }
  console.log('More than one distinct ranch_id above means the shipped key reads across ranches.');
}

if (values.tamper) await tamperCheck();
if (values.algolia) await algoliaCheck();
