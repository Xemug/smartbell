import { readFileSync } from 'node:fs';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc } from 'firebase/firestore';

const [host, port] = (process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8180').split(':');

export const OWNER = 'owner-uid';
export const MEMBER = 'member-uid';
export const INVITED = 'invited-uid';
export const STRANGER = 'stranger-uid';
export const OTHER_OWNER = 'other-owner-uid';

export async function envFor(rulesFile) {
  return initializeTestEnvironment({
    projectId: 'demo-smartbell',
    firestore: { host, port: Number(port), rules: readFileSync(new URL(`../${rulesFile}`, import.meta.url), 'utf8') },
  });
}

export const db = (env, uid) => (uid ? env.authenticatedContext(uid) : env.unauthenticatedContext()).firestore();

/** Two ranches: ranch-a (owner, one member, one invited) and ranch-b (someone else's). */
export async function seed(env) {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const f = ctx.firestore();
    const user = (uid) => doc(f, 'Users', uid);
    const ranchA = doc(f, 'Ranches', 'ranch-a');
    for (const uid of [OWNER, MEMBER, INVITED, STRANGER, OTHER_OWNER]) {
      await setDoc(user(uid), { uid, userName: uid, email: `${uid}@example.test`, phone_number: '000', premium: false });
    }
    await setDoc(ranchA, {
      user_id: user(OWNER),
      ranch_name: 'A',
      total_cows: 1,
      memberIds: [MEMBER],
      invitedUsers: [user(INVITED)],
      workesList: [{ user: user(MEMBER), rol: 'Worker', status: 'Active', userName: 'm' }],
    });
    await setDoc(doc(f, 'Ranches', 'ranch-b'), { user_id: user(OTHER_OWNER), ranch_name: 'B', memberIds: [], invitedUsers: [] });
    await setDoc(doc(f, 'Cows', 'cow-a'), { name: 'Bessie', ranch_id: ranchA });
    await setDoc(doc(f, 'Tasks', 'task-a'), { title: 't', ranch_id: ranchA });
    await setDoc(doc(f, 'Ranches', 'ranch-a', 'productionPerDays', 'day-1'), { total: 10, ranch_id: ranchA });
  });
}
