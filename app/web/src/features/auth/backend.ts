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
  /** Whether the signed-in user can sign in with a password (not only Google or Apple). */
  hasPassword(): boolean;
  /** Re-authenticates with `current`, then sets `next`. */
  changePassword(current: string, next: string): Promise<void>;
  signOut(): Promise<void>;
}

/** A failed auth call. `code` is Firebase's (`auth/…`) or the API's (`email_in_use`). */
export class AuthError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = 'AuthError';
  }
}
