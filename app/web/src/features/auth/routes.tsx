import type { RouteObject } from 'react-router-dom';

import { ForgotPasswordPage } from './ForgotPasswordPage';
import { GuestOnly } from './guards';
import { LoginPage } from './LoginPage';
import { SignUpPage } from './SignUpPage';
import { WelcomePage } from './WelcomePage';

export const guestRoute: RouteObject = {
  element: <GuestOnly />,
  children: [
    { path: '/bienvenida', element: <WelcomePage /> },
    { path: '/entrar', element: <LoginPage /> },
    { path: '/registro', element: <SignUpPage /> },
    { path: '/recuperar', element: <ForgotPasswordPage /> },
  ],
};
