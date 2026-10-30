import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';

import { DevTokensPage } from './pages/DevTokensPage';
import { HomePage } from './pages/HomePage';

const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/dev/tokens', element: <DevTokensPage /> },
]);
const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
