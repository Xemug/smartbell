import { Navigate, type RouteObject } from 'react-router-dom';

import { RequireAdmin } from '../features/admin/RequireAdmin';
import { SupportAdminPage } from '../features/admin/SupportAdminPage';
import { ADMIN_SUPPORT_PATH } from '../features/admin/useIsAdmin';
import { ANIMALS_PATH, AnimalListPage } from '../features/animals/list/AnimalListPage';
import { FIRST_COW_PATH } from '../features/auth/guards';
import { AccountPage } from '../features/config/account/AccountPage';
import { RanchPage } from '../features/config/ranch/RanchPage';
import { EditUserPage, NewUserPage } from '../features/config/users/UserFormPage';
import { UsersPage } from '../features/config/users/UsersPage';
import { HomePage } from '../pages/HomePage';
import { AppShell } from './AppShell';
import { PlaceholderPage } from './PlaceholderPage';

export const shellRoute: RouteObject = {
  element: <AppShell />,
  children: [
    { path: '/', element: <HomePage /> },
    // Held for `onboarding-hub`, which builds the first-cow form.
    { path: FIRST_COW_PATH, element: <PlaceholderPage titleKey="auth.firstCow" /> },
    { path: ANIMALS_PATH, element: <AnimalListPage /> },
    // Held for `animal-forms` (nueva) and `cow-profile` (:id).
    { path: '/vacas/:id', element: <PlaceholderPage titleKey="nav.vacas" /> },
    { path: '/grupos', element: <PlaceholderPage titleKey="nav.grupos" /> },
    { path: '/reportes', element: <PlaceholderPage titleKey="nav.reportes" /> },
    { path: '/ranchos', element: <PlaceholderPage titleKey="nav.ranchos" /> },
    { path: '/usuarios', element: <PlaceholderPage titleKey="nav.usuarios" /> },
    { path: '/config/perfil', element: <AccountPage /> },
    { path: '/config/ranchos', element: <RanchPage /> },
    { path: '/config/mensajes', element: <PlaceholderPage titleKey="config.messages" /> },
    { path: '/config/usuarios', element: <UsersPage /> },
    { path: '/config/usuarios/nuevo', element: <NewUserPage /> },
    { path: '/config/usuarios/:userId', element: <EditUserPage /> },
    { path: '/config/*', element: <PlaceholderPage titleKey="config.title" /> },
    // Smartbell staff only; a rancher who types the address is sent home.
    {
      path: ADMIN_SUPPORT_PATH,
      element: (
        <RequireAdmin>
          <SupportAdminPage />
        </RequireAdmin>
      ),
    },
    { path: '*', element: <Navigate to="/" replace /> },
  ],
};
