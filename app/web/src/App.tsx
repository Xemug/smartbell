import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';

import { HomePage } from './pages/HomePage';

// The token, icon and component previews are internal, so they stay out of the main bundle.
const DevTokensPage = lazy(() =>
  import('./pages/DevTokensPage').then((m) => ({ default: m.DevTokensPage })),
);
const DevIconsPage = lazy(() =>
  import('./pages/DevIconsPage').then((m) => ({ default: m.DevIconsPage })),
);
const DevUiPage = lazy(() => import('./pages/DevUiPage').then((m) => ({ default: m.DevUiPage })));

const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
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
]);
const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
