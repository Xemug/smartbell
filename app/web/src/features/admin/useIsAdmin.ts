import { useOptionalAuth } from '../auth/useAuth';

/** The "Soporte y demanda" page, for Smartbell staff only. */
export const ADMIN_SUPPORT_PATH = '/admin/soporte';

/** True for Smartbell staff (a verified email in the API's ADMIN_EMAILS), not a ranch role. */
export function useIsAdmin(): boolean {
  const auth = useOptionalAuth();
  return auth?.state.status === 'signedIn' && auth.state.account.is_admin;
}
