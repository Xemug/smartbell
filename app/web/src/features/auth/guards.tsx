import { useTranslation } from 'react-i18next';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { SplashScreen } from './SplashScreen';
import { useAuth } from './useAuth';

export const FIRST_COW_PATH = '/primera-vaca';

function SessionError() {
  const { t } = useTranslation();
  const { retry, signOut } = useAuth();
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-4">
      <EmptyState illustration="cow-sad" title={t('auth.sessionError')} />
      <Button onClick={retry}>{t('auth.retry')}</Button>
      <Button variant="ghost" onClick={() => void signOut()}>
        {t('shell.logout')}
      </Button>
    </main>
  );
}

/** The app itself: signed-out visitors go to the V4 Home, keeping where they were headed. */
export function RequireAuth() {
  const { state } = useAuth();
  const location = useLocation();
  if (state.status === 'loading') return <SplashScreen />;
  if (state.status === 'sessionError') return <SessionError />;
  if (state.status === 'signedOut')
    return <Navigate to="/bienvenida" replace state={{ from: location }} />;
  return <Outlet />;
}

function safeReturnPath(state: unknown): string {
  const from = (state as { from?: { pathname?: unknown } } | null)?.from?.pathname;
  // Only an in-app path: never a protocol-relative "//host" that would leave the site.
  return typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') ? from : '/';
}

/** Home, log-in and sign-up. A new account goes to the first-cow step, others back in. */
export function GuestOnly() {
  const { state } = useAuth();
  const location = useLocation();
  if (state.status === 'loading') return <SplashScreen />;
  if (state.status === 'signedIn') {
    const to = state.created ? FIRST_COW_PATH : safeReturnPath(location.state);
    return <Navigate to={to} replace />;
  }
  if (state.status === 'sessionError') return <SessionError />;
  return <Outlet />;
}
