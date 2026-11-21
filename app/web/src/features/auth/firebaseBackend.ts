import { FirebaseError, initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  GoogleAuthProvider,
  initializeAuth,
  OAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  updateProfile,
  browserPopupRedirectResolver,
} from 'firebase/auth';

import { AuthError, type AuthBackend, type SocialProvider } from './backend';
import { authEmulatorUrl, firebaseOptions } from './firebaseConfig';

async function mapErrors<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    throw error instanceof FirebaseError ? new AuthError(error.code) : error;
  }
}

function providerFor(provider: SocialProvider) {
  if (provider === 'google') {
    const google = new GoogleAuthProvider();
    // Always ask which account: ranch phones are often shared, and Google otherwise signs in
    // silently with whichever account the browser already has.
    google.setCustomParameters({ prompt: 'select_account' });
    return google;
  }
  const apple = new OAuthProvider('apple.com');
  apple.addScope('email');
  apple.addScope('name');
  return apple;
}

export function createFirebaseBackend(): AuthBackend {
  if (!firebaseOptions.projectId || !firebaseOptions.apiKey) {
    throw new Error('Set VITE_FIREBASE_PROJECT_ID and VITE_FIREBASE_API_KEY for this build');
  }
  const app = initializeApp(firebaseOptions);
  const auth = initializeAuth(app, {
    persistence: browserLocalPersistence,
    popupRedirectResolver: browserPopupRedirectResolver,
  });
  auth.languageCode = 'es-419'; // The reset email, in Latin American Spanish.
  if (authEmulatorUrl) connectAuthEmulator(auth, authEmulatorUrl, { disableWarnings: true });

  return {
    onChange: (listener) => onAuthStateChanged(auth, (user) => listener(user !== null)),
    getToken: async () => (auth.currentUser ? auth.currentUser.getIdToken() : null),
    signIn: (email, password) =>
      mapErrors(async () => {
        await signInWithEmailAndPassword(auth, email, password);
      }),
    signUp: (email, password, displayName) =>
      mapErrors(async () => {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(user, { displayName });
      }),
    signInWithProvider: (provider) =>
      mapErrors(async () => {
        await signInWithPopup(auth, providerFor(provider));
      }),
    sendPasswordReset: (email) => mapErrors(() => sendPasswordResetEmail(auth, email)),
    hasPassword: () =>
      auth.currentUser?.providerData.some((p) => p.providerId === 'password') ?? false,
    changePassword: (current, next) =>
      mapErrors(async () => {
        const user = auth.currentUser;
        if (!user?.email) throw new AuthError('auth/requires-recent-login');
        await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, current));
        await updatePassword(user, next);
      }),
    sendEmailVerification: () =>
      mapErrors(async () => {
        if (auth.currentUser) await sendEmailVerification(auth.currentUser);
      }),
    refreshIdentity: () =>
      mapErrors(async () => {
        if (!auth.currentUser) return;
        await reload(auth.currentUser);
        await auth.currentUser.getIdToken(true);
      }),
    signOut: () => mapErrors(() => signOut(auth)),
  };
}
