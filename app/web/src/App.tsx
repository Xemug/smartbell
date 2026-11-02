import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';

import { appRoutes } from './app/appRoutes';
import { AuthProvider } from './features/auth/AuthProvider';
import { SnackbarProvider } from './ui/SnackbarProvider';

const router = createBrowserRouter(appRoutes);
const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SnackbarProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </SnackbarProvider>
    </QueryClientProvider>
  );
}
