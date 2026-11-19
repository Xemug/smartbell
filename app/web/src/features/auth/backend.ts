export type SocialProvider = 'google' | 'apple';

/** The identity provider, behind an interface so tests (and later Capacitor) can swap it. */
export interface AuthBackend {
  /** Fires once with the restored session, then on every sign-in and sign-out. */
  onChange(listener: (signedIn: boolean) => void): () => void;
  getToken(): Promise<string | null>;
  signIn(email: string, password: string): Promise<void>;
  signUp(email: string, password: string, displayName: string): Promise<void>;
  signInWithProvider(provider: SocialProvider): Promise<void>;
  sendPasswordReset(email: string): Promise<void>;
  /** Emails the signed-in user a link that confirms their address. */
  sendEmailVerification(): Promise<void>;
  /** Re-reads the account and mints a fresh token, so a just-confirmed email shows in it. */
  refreshIdentity(): Promise<void>;
  signOut(): Promise<void>;
}

/** A failed auth call. `code` is Firebase's (`auth/…`) or the API's (`email_in_use`). */
export class AuthError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = 'AuthError';
  }
}
