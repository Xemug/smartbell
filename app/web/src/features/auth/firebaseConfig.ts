const env = import.meta.env;

// Dev and e2e run on the Auth emulator with a `demo-` project, which can't reach any real Firebase
// resource. A production build must name its project; the live one is never a default.
export const firebaseProjectId = env.VITE_FIREBASE_PROJECT_ID || (env.DEV ? 'demo-smartbell' : '');

const isDemo = firebaseProjectId.startsWith('demo-');

/** Only a demo project may use the emulator, which accepts any token it is shown. */
export const authEmulatorUrl = isDemo
  ? env.VITE_FIREBASE_AUTH_EMULATOR_URL || 'http://127.0.0.1:9099'
  : undefined;

export const firebaseOptions = {
  apiKey: env.VITE_FIREBASE_API_KEY || (isDemo ? 'demo-api-key' : ''),
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || `${firebaseProjectId}.firebaseapp.com`,
  projectId: firebaseProjectId,
  appId: env.VITE_FIREBASE_APP_ID || undefined,
};
