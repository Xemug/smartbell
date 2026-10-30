import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';

import { HomePage } from './pages/HomePage';

// The token preview is internal, so it stays out of the main bundle.
const DevTokensPage = lazy(() =>
  import('./pages/DevTokensPage').then((m) => ({ default: m.DevTokensPage })),
);

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
]);
const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
