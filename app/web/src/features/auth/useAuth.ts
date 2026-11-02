import { createContext, useContext } from 'react';

import type { SocialProvider } from './backend';
import type { Account } from './session';

export type AuthState =
  | { status: 'loading' }
  | { status: 'signedOut'; error?: string }
  | { status: 'signedIn'; account: Account; created: boolean }
  /** Firebase signed in but our API could not open the account; the user can retry. */
  | { status: 'sessionError' };

export interface SignUpData {
  name: string;
  phone: string;
  email: string;
  password: string;
}

export interface AuthApi {
  state: AuthState;
  signIn(email: string, password: string): Promise<void>;
  signUp(data: SignUpData): Promise<void>;
  signInWith(provider: SocialProvider): Promise<void>;
  resetPassword(email: string): Promise<void>;
  signOut(): Promise<void>;
  retry(): void;
}

export const AuthContext = createContext<AuthApi | null>(null);

export function useAuth(): AuthApi {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth needs an AuthProvider above it');
  return auth;
}

/** For chrome that also renders without auth, such as the shell in its own tests. */
export function useOptionalAuth(): AuthApi | null {
  return useContext(AuthContext);
}
