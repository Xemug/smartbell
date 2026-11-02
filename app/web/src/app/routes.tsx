import { Navigate, type RouteObject } from 'react-router-dom';

import { FIRST_COW_PATH } from '../features/auth/guards';
import { HomePage } from '../pages/HomePage';
import { AppShell } from './AppShell';
import { PlaceholderPage } from './PlaceholderPage';

export const shellRoute: RouteObject = {
  element: <AppShell />,
  children: [
    { path: '/', element: <HomePage /> },
    // Held for `onboarding-hub`, which builds the first-cow form.
    { path: FIRST_COW_PATH, element: <PlaceholderPage titleKey="auth.firstCow" /> },
    { path: '/vacas', element: <PlaceholderPage titleKey="nav.vacas" /> },
    { path: '/vacas/:id', element: <PlaceholderPage titleKey="nav.vacas" /> },
    { path: '/grupos', element: <PlaceholderPage titleKey="nav.grupos" /> },
    { path: '/reportes', element: <PlaceholderPage titleKey="nav.reportes" /> },
    { path: '/ranchos', element: <PlaceholderPage titleKey="nav.ranchos" /> },
    { path: '/usuarios', element: <PlaceholderPage titleKey="nav.usuarios" /> },
    { path: '/config/perfil', element: <PlaceholderPage titleKey="config.profile" /> },
    { path: '/config/ranchos', element: <PlaceholderPage titleKey="config.ranches" /> },
    { path: '/config/mensajes', element: <PlaceholderPage titleKey="config.messages" /> },
    { path: '/config/usuarios', element: <PlaceholderPage titleKey="config.users" /> },
    { path: '/config/*', element: <PlaceholderPage titleKey="config.title" /> },
    { path: '*', element: <Navigate to="/" replace /> },
  ],
};
