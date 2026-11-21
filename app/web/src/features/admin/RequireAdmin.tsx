import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { useIsAdmin } from './useIsAdmin';

/** Everyone else is sent home. The API still answers them 403: this only hides the page. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  return useIsAdmin() ? children : <Navigate to="/" replace />;
}
