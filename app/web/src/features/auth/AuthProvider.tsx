import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { setTokenGetter } from '../../api/client';
import { AuthError, type AuthBackend } from './backend';
import { createFirebaseBackend } from './firebaseBackend';
import { openSession, type SessionProfile } from './session';
import { AuthContext, type AuthApi, type AuthState, type SignUpData } from './useAuth';

// The API's refusals: the account can't be opened, so the Firebase sign-in is undone.
const accountRefusals = new Set(['email_in_use', 'email_required']);

export function AuthProvider({
  backend,
  children,
}: {
  backend?: AuthBackend;
  children: ReactNode;
}) {
  const [auth] = useState(() => backend ?? createFirebaseBackend());
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>({ status: 'loading' });
  // Sign-up fields the token can't carry, sent with the session call the sign-up triggers.
  const pendingProfile = useRef<SessionProfile>();
  const pendingError = useRef<string>();
  const generation = useRef(0);

  const sync = useCallback(async () => {
    const run = ++generation.current;
    setState({ status: 'loading' });
    const token = await auth.getToken();
    if (run !== generation.current) return;
    if (!token) {
      setState({ status: 'signedOut' });
      return;
    }
    const result = await openSession(token, pendingProfile.current);
    if (run !== generation.current) return;
    if (result.ok) {
      pendingProfile.current = undefined;
      setState({ status: 'signedIn', account: result.account, created: result.created });
    } else if (accountRefusals.has(result.code)) {
      pendingProfile.current = undefined;
      pendingError.current = result.code;
      try {
        await auth.signOut();
      } catch {
        // Firebase still thinks it's signed in, but the app must not sit on the splash.
        if (run === generation.current) setState({ status: 'signedOut', error: result.code });
      }
    } else setState({ status: 'sessionError' });
  }, [auth]);

  useEffect(() => {
    setTokenGetter(() => auth.getToken());
    const unsubscribe = auth.onChange((signedIn) => {
      if (signedIn) {
        void sync();
        return;
      }
      generation.current++;
      // Whatever a failed sign-up left behind must not be sent with the next person's account.
      pendingProfile.current = undefined;
      queryClient.clear();
      setState({ status: 'signedOut', error: pendingError.current });
      pendingError.current = undefined;
    });
    return () => {
      unsubscribe();
      setTokenGetter(null);
    };
  }, [auth, sync, queryClient]);

  const api = useMemo<AuthApi>(
    () => ({
      state,
      signIn: (email, password) => auth.signIn(email.trim(), password),
      signUp: async ({ name, phone, email, password }: SignUpData) => {
        pendingProfile.current = { first_name: name.trim(), phone: phone || undefined };
        try {
          await auth.signUp(email.trim(), password, name.trim());
        } catch (error) {
          pendingProfile.current = undefined;
          throw error;
        }
      },
      signInWith: (provider) => auth.signInWithProvider(provider),
      resetPassword: async (email) => {
        try {
          await auth.sendPasswordReset(email.trim());
        } catch (error) {
          // Same answer whether or not the account exists, so the form can't probe for emails.
          if (error instanceof AuthError && error.code === 'auth/user-not-found') return;
          throw error;
        }
      },
      signOut: () => auth.signOut(),
      retry: () => void sync(),
    }),
    [auth, state, sync],
  );

  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>;
}
