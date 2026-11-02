import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { appRoutes } from '../../app/appRoutes';
import { SnackbarProvider } from '../../ui/SnackbarProvider';
import { AuthProvider } from './AuthProvider';
import { AuthError, type AuthBackend } from './backend';

const PASSWORD = 'secreto123';

class FakeBackend implements AuthBackend {
  user: string | null;
  private listeners = new Set<(signedIn: boolean) => void>();

  constructor(signedInAs: string | null = null) {
    this.user = signedInAs;
  }

  private set(user: string | null) {
    this.user = user;
    this.listeners.forEach((listener) => listener(user !== null));
  }

  onChange(listener: (signedIn: boolean) => void) {
    this.listeners.add(listener);
    queueMicrotask(() => listener(this.user !== null));
    return () => this.listeners.delete(listener);
  }
  getToken = async () => (this.user ? `token-for-${this.user}` : null);
  signIn = vi.fn(async (email: string, password: string) => {
    if (password !== PASSWORD) throw new AuthError('auth/invalid-credential');
    this.set(email);
  });
  signUp = vi.fn(async (email: string) => {
    if (email === 'taken@example.com') throw new AuthError('auth/email-already-in-use');
    this.set(email);
  });
  signInWithProvider = vi.fn(async () => {
    throw new AuthError('auth/popup-closed-by-user');
  });
  sendPasswordReset = vi.fn(async () => {
    throw new AuthError('auth/user-not-found');
  });
  signOut = vi.fn(async () => this.set(null));
}

interface ApiCall {
  url: string;
  authorization: string | null;
  body: unknown;
}

function account(created: boolean, ranches = [{ id: 'r1', name: 'Mi rancho', role: 'DUENO' }]) {
  return {
    user: {
      id: 'u1',
      first_name: 'Ana',
      last_name: null,
      email: 'ana@example.com',
      phone: null,
      photo_url: null,
    },
    ranches,
    created,
  };
}

function stubApi(session: () => Response): ApiCall[] {
  const calls: ApiCall[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (request: Request) => {
      const text = await request.clone().text();
      calls.push({
        url: new URL(request.url).pathname,
        authorization: request.headers.get('Authorization'),
        body: text ? JSON.parse(text) : null,
      });
      if (request.url.endsWith('/api/auth/session')) return session();
      return Response.json({ status: 'ok' });
    }),
  );
  return calls;
}

function renderApp(backend: FakeBackend, path: string) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
  vi.stubGlobal('scrollTo', vi.fn());
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] });
  render(
    <QueryClientProvider client={new QueryClient()}>
      <SnackbarProvider>
        <AuthProvider backend={backend}>
          <RouterProvider router={router} />
        </AuthProvider>
      </SnackbarProvider>
    </QueryClientProvider>,
  );
  return router;
}

const user = userEvent.setup();

async function fillSignUp(overrides: Partial<Record<string, string>> = {}) {
  const values = {
    Nombre: 'Ana Pérez',
    Teléfono: '3334567890',
    'Correo electrónico': 'ana@example.com',
    Contraseña: PASSWORD,
    'Confirmar contraseña': PASSWORD,
    ...overrides,
  };
  for (const [label, value] of Object.entries(values)) {
    if (value) await user.type(screen.getByLabelText(label, { selector: 'input' }), value);
  }
}

describe('auth', () => {
  it('sends a signed-out visitor to the V4 Home, which links to log-in and sign-up', async () => {
    stubApi(() => Response.json(account(false)));
    const router = renderApp(new FakeBackend(), '/vacas');

    expect(await screen.findByRole('link', { name: 'Iniciar Sesión' })).toHaveAttribute(
      'href',
      '/entrar',
    );
    expect(screen.getByRole('link', { name: 'Crear Cuenta' })).toHaveAttribute('href', '/registro');
    expect(router.state.location.pathname).toBe('/bienvenida');
  });

  it('shows the splash while the session is restored', () => {
    stubApi(() => Response.json(account(false)));
    renderApp(new FakeBackend('ana@example.com'), '/');

    expect(screen.getByRole('status', { name: 'Cargando Smartbell' })).toBeInTheDocument();
  });

  it('sign-up sends the profile with the token and lands on the first-cow step', async () => {
    const calls = stubApi(() => Response.json(account(true)));
    const backend = new FakeBackend();
    const router = renderApp(backend, '/registro');
    await screen.findByRole('button', { name: 'Crear Cuenta' });

    await fillSignUp();
    await user.click(screen.getByRole('checkbox', { name: 'Acepto los Términos y condiciones' }));
    await user.click(screen.getByRole('button', { name: 'Crear Cuenta' }));

    expect(await screen.findByRole('heading', { name: 'Registra tu primera vaca' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/primera-vaca');
    expect(backend.signUp).toHaveBeenCalledWith('ana@example.com', PASSWORD, 'Ana Pérez');
    const session = calls.find((call) => call.url === '/api/auth/session');
    expect(session?.authorization).toBe('Bearer token-for-ana@example.com');
    expect(session?.body).toEqual({ first_name: 'Ana Pérez', phone: '+523334567890' });
    // The shell shows the ranch the API made.
    expect(screen.getByRole('button', { name: /Mi rancho/ })).toBeInTheDocument();
  });

  it('sign-up checks the form before calling Firebase', async () => {
    stubApi(() => Response.json(account(true)));
    const backend = new FakeBackend();
    renderApp(backend, '/registro');
    await screen.findByRole('button', { name: 'Crear Cuenta' });

    await fillSignUp({ 'Confirmar contraseña': 'otra-cosa' });
    await user.click(screen.getByRole('button', { name: 'Crear Cuenta' }));

    expect(await screen.findByText('Las contraseñas no coinciden')).toBeInTheDocument();
    expect(
      screen.getByText('Acepta los Términos y condiciones para continuar'),
    ).toBeInTheDocument();
    expect(backend.signUp).not.toHaveBeenCalled();
  });

  it('shows Firebase errors in Spanish', async () => {
    stubApi(() => Response.json(account(true)));
    renderApp(new FakeBackend(), '/registro');
    await screen.findByRole('button', { name: 'Crear Cuenta' });

    await fillSignUp({ 'Correo electrónico': 'taken@example.com' });
    await user.click(screen.getByRole('checkbox', { name: 'Acepto los Términos y condiciones' }));
    await user.click(screen.getByRole('button', { name: 'Crear Cuenta' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Ya hay una cuenta con ese correo. Inicia sesión.',
    );
  });

  it('log-in with a wrong password says so and stays put', async () => {
    stubApi(() => Response.json(account(false)));
    const router = renderApp(new FakeBackend(), '/entrar');

    await user.type(await screen.findByLabelText('Correo electrónico'), 'ana@example.com');
    await user.type(screen.getByLabelText('Contraseña', { selector: 'input' }), 'mala');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El correo o la contraseña no son correctos',
    );
    expect(router.state.location.pathname).toBe('/entrar');
  });

  it('log-in returns to the page the visitor asked for', async () => {
    stubApi(() => Response.json(account(false)));
    const router = renderApp(new FakeBackend(), '/vacas');
    await user.click(await screen.findByRole('link', { name: 'Iniciar Sesión' }));
    // The Home link drops the state, so this checks the default: the tasks home.
    await user.type(await screen.findByLabelText('Correo electrónico'), 'ana@example.com');
    await user.type(screen.getByLabelText('Contraseña', { selector: 'input' }), PASSWORD);
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
  });

  it('a deep link survives the log-in redirect', async () => {
    stubApi(() => Response.json(account(false)));
    const backend = new FakeBackend();
    const router = renderApp(backend, '/vacas');
    await screen.findByRole('link', { name: 'Iniciar Sesión' });
    const from = router.state.location.state as { from: { pathname: string } };
    expect(from.from.pathname).toBe('/vacas');

    await act(() => router.navigate('/entrar', { state: from }));
    await user.type(await screen.findByLabelText('Correo electrónico'), 'ana@example.com');
    await user.type(screen.getByLabelText('Contraseña', { selector: 'input' }), PASSWORD);
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/vacas'));
  });

  it('a refused account is signed out with the reason', async () => {
    stubApi(() => Response.json({ detail: 'email_in_use' }, { status: 409 }));
    const backend = new FakeBackend();
    renderApp(backend, '/entrar');

    await user.type(await screen.findByLabelText('Correo electrónico'), 'ana@example.com');
    await user.type(screen.getByLabelText('Contraseña', { selector: 'input' }), PASSWORD);
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Ese correo ya pertenece a otra cuenta',
    );
    expect(backend.signOut).toHaveBeenCalled();
    expect(backend.user).toBeNull();
  });

  it('an API outage offers a retry that recovers', async () => {
    let fail = true;
    stubApi(() => (fail ? new Response('down', { status: 500 }) : Response.json(account(false))));
    renderApp(new FakeBackend('ana@example.com'), '/');

    await user.click(await screen.findByRole('button', { name: 'Reintentar' }));
    expect(screen.getByText('No pudimos abrir tu cuenta')).toBeInTheDocument();
    fail = false;
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByRole('navigation')).toBeInTheDocument();
  });

  it('forgot password answers the same whether or not the account exists', async () => {
    stubApi(() => Response.json(account(false)));
    const backend = new FakeBackend();
    renderApp(backend, '/entrar');

    await user.click(await screen.findByRole('link', { name: '¿Olvidaste tu contraseña?' }));
    await user.type(await screen.findByLabelText('Correo electrónico'), 'nadie@example.com');
    await user.click(screen.getByRole('button', { name: 'Enviar enlace' }));

    expect(await screen.findByRole('status')).toHaveTextContent('te enviamos un enlace');
    expect(backend.sendPasswordReset).toHaveBeenCalledWith('nadie@example.com');
  });

  it('closing the Google window is not an error', async () => {
    stubApi(() => Response.json(account(false)));
    const backend = new FakeBackend();
    renderApp(backend, '/entrar');

    await user.click(await screen.findByRole('button', { name: 'Continuar con Google' }));

    expect(backend.signInWithProvider).toHaveBeenCalledWith('google');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('Cerrar sesión signs out and returns to the Home', async () => {
    stubApi(() => Response.json(account(false)));
    const backend = new FakeBackend('ana@example.com');
    const router = renderApp(backend, '/');

    await user.click(await screen.findByRole('button', { name: /Menú de cuenta/ }));
    await user.click(await screen.findByRole('menuitem', { name: 'Cerrar sesión' }));

    expect(await screen.findByRole('link', { name: 'Crear Cuenta' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/bienvenida');
    expect(backend.signOut).toHaveBeenCalled();
  });

  it('a signed-in visitor skips the guest pages, and API calls carry the token', async () => {
    const calls = stubApi(() => Response.json(account(false)));
    const router = renderApp(new FakeBackend('ana@example.com'), '/registro');

    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
    await waitFor(() =>
      expect(calls.find((call) => call.url === '/api/health')?.authorization).toBe(
        'Bearer token-for-ana@example.com',
      ),
    );
  });
});
