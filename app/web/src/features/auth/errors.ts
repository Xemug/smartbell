import { AuthError } from './backend';

const keys: Record<string, string> = {
  'auth/invalid-credential': 'invalidCredentials',
  'auth/invalid-login-credentials': 'invalidCredentials',
  'auth/wrong-password': 'invalidCredentials',
  'auth/user-not-found': 'invalidCredentials',
  'auth/invalid-email': 'invalidEmail',
  'auth/email-already-in-use': 'emailInUse',
  'auth/weak-password': 'weakPassword',
  'auth/too-many-requests': 'tooManyRequests',
  'auth/network-request-failed': 'network',
  'auth/account-exists-with-different-credential': 'differentProvider',
  'auth/popup-blocked': 'popupBlocked',
  'auth/user-disabled': 'disabled',
  email_in_use: 'accountConflict',
  email_required: 'emailRequired',
};

/** The i18n key for a failed auth call. */
export function authErrorKey(error: unknown): string {
  const code = error instanceof AuthError ? error.code : typeof error === 'string' ? error : '';
  return `auth.errors.${keys[code] ?? 'generic'}`;
}

/** Closing the provider's window is the user changing their mind, not an error. */
export function isCancelled(error: unknown): boolean {
  return (
    error instanceof AuthError &&
    ['auth/popup-closed-by-user', 'auth/cancelled-popup-request'].includes(error.code)
  );
}
