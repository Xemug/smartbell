import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';

import { RequireAuth } from '../features/auth/guards';
import { guestRoute } from '../features/auth/routes';
import { shellRoute } from './routes';

// The token, icon and component previews are internal, so they stay out of the main bundle.
const DevTokensPage = lazy(() =>
  import('../pages/DevTokensPage').then((m) => ({ default: m.DevTokensPage })),
);
const DevIconsPage = lazy(() =>
  import('../pages/DevIconsPage').then((m) => ({ default: m.DevIconsPage })),
);
const DevUiPage = lazy(() => import('../pages/DevUiPage').then((m) => ({ default: m.DevUiPage })));

export const appRoutes: RouteObject[] = [
  guestRoute,
  { element: <RequireAuth />, children: [shellRoute] },
  {
    path: '/dev/tokens',
    element: (
      <Suspense>
        <DevTokensPage />
      </Suspense>
    ),
  },
  {
    path: '/dev/icons',
    element: (
      <Suspense>
        <DevIconsPage />
      </Suspense>
    ),
  },
  {
    path: '/dev/ui',
    element: (
      <Suspense>
        <DevUiPage />
      </Suspense>
    ),
  },
];
