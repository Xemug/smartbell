import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { format, subDays } from 'date-fns';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { shellRoute } from '../../app/routes';
import { SnackbarProvider } from '../../ui/SnackbarProvider';
import { AuthContext, type AuthApi } from '../auth/useAuth';
import { ADMIN_SUPPORT_PATH } from './useIsAdmin';

const savedConfig = {
  whatsapp_number: '523334056398',
  support_message: 'Hola, necesito ayuda.',
  payment_message: null,
  feature_message: null,
  community_url: null,
};

// Taps on two dates: three recent ones (two people) and one from long ago.
const recent = subDays(new Date(), 3);
const old = subDays(new Date(), 60);
const taps = [
  { feature: 'REPORTES', user: 'u1', at: recent },
  { feature: 'REPORTES', user: 'u2', at: recent },
  { feature: 'REPORTES', user: 'u1', at: subDays(recent, 1) },
  { feature: 'GRUPOS', user: 'u1', at: old },
];
const features = ['GRUPOS', 'REPORTES', 'USUARIOS', 'RANCHOS'];

/** What GET /api/admin/fake-door-taps answers for the fixture, as the API computes it. */
function reportSince(since: string | null) {
  const from = since ? new Date(since) : null;
  const kept = taps.filter((tap) => !from || tap.at >= from);
  const rows = features.map((feature) => {
    const mine = kept.filter((tap) => tap.feature === feature);
    const last = mine.map((tap) => tap.at.getTime()).sort((a, b) => b - a)[0];
    return {
      feature,
      taps: mine.length,
      users: new Set(mine.map((tap) => tap.user)).size,
      last_tapped_at: last ? new Date(last).toISOString() : null,
    };
  });
  rows.sort((a, b) => b.taps - a.taps);
  return { since, features: rows };
}

interface Call {
  method: string;
  path: string;
  query: URLSearchParams;
  body: unknown;
}
let calls: Call[];
let overrides: Record<string, () => Response | Promise<Response>>;

function authFor(isAdmin: boolean): AuthApi {
  const noop = vi.fn(async () => {});
  return {
    state: {
      status: 'signedIn',
      account: {
        user: {
          id: 'u-1',
          first_name: 'Ana',
          last_name: null,
          email: 'ana@example.com',
          phone: null,
          photo_url: null,
        },
        ranches: [
          {
            id: 'ranch-1',
            name: 'Rancho San José',
            address: null,
            latitude: null,
            longitude: null,
            role: 'DUENO',
            permissions: [],
            is_owner: true,
            can_edit: true,
          },
        ],
        ranch_creation: 'upsell',
        is_admin: isAdmin,
      },
      created: false,
    },
    signIn: noop,
    signUp: noop,
    signInWith: noop,
    resetPassword: noop,
    sendVerificationEmail: noop,
    refreshIdentity: noop,
    refreshAccount: noop,
    setUser: vi.fn(),
    canChangePassword: () => false,
    changePassword: noop,
    signOut: noop,
    retry: vi.fn(),
  };
}

function renderAt(path: string, isAdmin: boolean, cachedConfig?: object) {
  const router = createMemoryRouter([shellRoute], { initialEntries: [path] });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  // What the app's support links left in the cache earlier in the session.
  if (cachedConfig) client.setQueryData(['support-config'], cachedConfig);
  render(
    <QueryClientProvider client={client}>
      <SnackbarProvider>
        <AuthContext.Provider value={authFor(isAdmin)}>
          <RouterProvider router={router} />
        </AuthContext.Provider>
      </SnackbarProvider>
    </QueryClientProvider>,
  );
  return router;
}

const puts = () => calls.filter((call) => call.method === 'PUT');

beforeEach(() => {
  calls = [];
  overrides = {};
  localStorage.clear();
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
  vi.stubGlobal('scrollTo', vi.fn());
  vi.stubGlobal(
    'fetch',
    vi.fn(async (request: Request) => {
      const url = new URL(request.url);
      const text = await request.text();
      const body = text ? JSON.parse(text) : null;
      calls.push({ method: request.method, path: url.pathname, query: url.searchParams, body });
      const key = `${request.method} ${url.pathname}`;
      if (overrides[key]) return overrides[key]();
      if (key === 'GET /api/support/config') return Response.json(savedConfig);
      if (key === 'PUT /api/admin/support/config') return Response.json(body);
      if (key === 'GET /api/admin/fake-door-taps')
        return Response.json(reportSince(url.searchParams.get('since')));
      return Response.json({ status: 'ok' });
    }),
  );
});

async function openAccountMenu() {
  await userEvent.click(screen.getByRole('button', { name: /Menú de cuenta/ }));
  return screen.findByRole('menu');
}

describe('who sees Soporte y demanda', () => {
  it('a rancher has no menu entry and is sent home from the address', async () => {
    const router = renderAt(ADMIN_SUPPORT_PATH, false);

    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
    expect(screen.queryByRole('heading', { name: 'Soporte y demanda' })).not.toBeInTheDocument();
    const menu = await openAccountMenu();
    expect(within(menu).queryByRole('menuitem', { name: 'Soporte y demanda' })).toBeNull();
    // The page never asked the admin API for anything.
    expect(calls.some((call) => call.path.startsWith('/api/admin/'))).toBe(false);
  });

  it('staff open it from the avatar menu', async () => {
    const router = renderAt('/', true);

    const menu = await openAccountMenu();
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Soporte y demanda' }));

    expect(router.state.location.pathname).toBe(ADMIN_SUPPORT_PATH);
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Soporte y demanda' }),
    ).toBeInTheDocument();
  });
});

describe('Soporte form', () => {
  const field = (name: string) => screen.getByLabelText(new RegExp(name));

  async function ready() {
    renderAt(ADMIN_SUPPORT_PATH, true);
    await waitFor(() => expect(field('Número de WhatsApp')).toHaveValue('523334056398'));
  }

  async function replace(name: string, value: string) {
    await userEvent.clear(field(name));
    // `{` and `[` start key descriptors in user-event; doubled, they are typed as is.
    if (value) await userEvent.type(field(name), value.replace(/[{[]/g, '$&$&'));
  }

  const stale = { ...savedConfig, whatsapp_number: '5211111111111', support_message: 'Viejo.' };

  it('opens on a cached config but shows the fresh one once it arrives', async () => {
    renderAt(ADMIN_SUPPORT_PATH, true, stale);

    await waitFor(() => expect(field('Número de WhatsApp')).toHaveValue('523334056398'));
    expect(field('Mensaje de soporte')).toHaveValue('Hola, necesito ayuda.');
    expect(calls.filter((call) => call.path === '/api/support/config')).toHaveLength(1);

    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await screen.findByText('Cambios guardados');
    // The save carries the fresh number, not the stale one it opened with.
    expect(
      puts().map((call) => (call.body as { whatsapp_number: string }).whatsapp_number),
    ).toEqual(['523334056398']);
  });

  it('keeps what the founder typed when the fresh config lands afterwards', async () => {
    let answer: (response: Response) => void = () => {};
    overrides['GET /api/support/config'] = () => new Promise((resolve) => (answer = resolve));
    renderAt(ADMIN_SUPPORT_PATH, true, stale);
    await waitFor(() => expect(field('Mensaje de soporte')).toHaveValue('Viejo.'));

    await replace('Mensaje de soporte', 'Nuevo texto.');
    answer(Response.json(savedConfig));

    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'Probar en WhatsApp' })).toHaveAttribute(
        'href',
        expect.stringContaining('523334056398'),
      ),
    );
    expect(field('Mensaje de soporte')).toHaveValue('Nuevo texto.');
  });

  it('saves every field, and an emptied message goes back to the default', async () => {
    await ready();
    expect(field('Mensaje de soporte')).toHaveValue('Hola, necesito ayuda.');

    await replace('Número de WhatsApp', '+52 1 33 1234-5678');
    await replace('Mensaje de soporte', '');
    await replace('Mensaje de pago', 'Quiero pagar con transferencia.');
    await replace('Mensaje de interés', 'Me interesa {nombre}.');
    await replace('Enlace a la comunidad', 'https://chat.whatsapp.com/AbC123');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByText('Cambios guardados')).toBeInTheDocument();
    expect(puts().map((call) => call.body)).toEqual([
      {
        whatsapp_number: '5213312345678',
        support_message: null,
        payment_message: 'Quiero pagar con transferencia.',
        feature_message: 'Me interesa {nombre}.',
        community_url: 'https://chat.whatsapp.com/AbC123',
      },
    ]);
  });

  it('refuses a bad number, link or feature message on the field, without saving', async () => {
    await ready();

    await replace('Número de WhatsApp', '12345');
    await replace('Enlace a la comunidad', 'http://chat.whatsapp.com/AbC123');
    await replace('Mensaje de interés', 'Me interesa esa funcionalidad.');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(
      await screen.findByText('Escribe solo el número con código de país, de 8 a 15 dígitos'),
    ).toBeInTheDocument();
    expect(screen.getByText('Escribe un enlace que empiece con https://')).toBeInTheDocument();
    expect(
      screen.getByText('Incluye {nombre} donde va el nombre de la funcionalidad'),
    ).toBeInTheDocument();
    expect(puts()).toHaveLength(0);
  });

  it('shows what the API refused on its field', async () => {
    overrides['PUT /api/admin/support/config'] = () =>
      Response.json(
        { detail: [{ loc: ['body', 'community_url'], msg: 'bad', type: 'url_parsing' }] },
        { status: 422 },
      );
    await ready();

    await replace('Enlace a la comunidad', 'https://chat.whatsapp.com/AbC123');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByText('El servidor no aceptó este valor')).toBeInTheDocument();
    expect(field('Enlace a la comunidad')).toHaveAttribute('aria-invalid', 'true');
  });

  it('says so when the save fails for another reason', async () => {
    overrides['PUT /api/admin/support/config'] = () =>
      Response.json({ detail: 'admin_only' }, { status: 403 });
    await ready();

    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByText('No pudimos guardar. Intenta de nuevo.')).toBeInTheDocument();
  });

  it('"Probar en WhatsApp" opens the saved number with the support message', async () => {
    await ready();

    const link = screen.getByRole('link', { name: 'Probar en WhatsApp' });
    const href = new URL(link.getAttribute('href') ?? '');
    expect(href.origin + href.pathname).toBe('https://wa.me/523334056398');
    expect(href.searchParams.get('text')).toBe('Hola, necesito ayuda.');
  });
});

describe('Demanda table', () => {
  const table = () => screen.findByRole('table', { name: 'Demanda de funcionalidades' });
  const rowOf = async (feature: string) =>
    within(await table())
      .getByRole('cell', { name: feature })
      .closest('tr') as HTMLElement;
  const cells = (row: HTMLElement) =>
    within(row)
      .getAllByRole('cell')
      .map((cell) => cell.textContent);

  it('matches the API for the last 30 days, and an earlier date widens it', async () => {
    renderAt(ADMIN_SUPPORT_PATH, true);

    const reportes = await rowOf('Reportes');
    expect(cells(reportes)).toEqual(['Reportes', '3', '2', format(recent, 'dd/MM/yyyy HH:mm')]);
    expect(cells(await rowOf('Grupos'))).toEqual(['Grupos', '0', '0', '—']);
    // Midnight where the founder is, 30 days back.
    const first = calls.find((call) => call.path === '/api/admin/fake-door-taps');
    expect(new Date(first?.query.get('since') ?? '').getTime()).toBe(
      new Date(format(subDays(new Date(), 30), 'yyyy-MM-dd') + 'T00:00:00').getTime(),
    );

    const date = screen.getByLabelText('Desde');
    await userEvent.clear(date);
    await userEvent.type(date, format(subDays(old, 1), 'ddMMyyyy'));

    await waitFor(async () =>
      expect(cells(await rowOf('Grupos'))).toEqual([
        'Grupos',
        '1',
        '1',
        format(old, 'dd/MM/yyyy HH:mm'),
      ]),
    );
  });

  it('the since filter narrows it, down to an empty state', async () => {
    renderAt(ADMIN_SUPPORT_PATH, true);
    await rowOf('Reportes');

    const date = screen.getByLabelText('Desde');
    await userEvent.clear(date);
    await userEvent.type(date, format(subDays(recent, -1), 'ddMMyyyy'));

    expect(await screen.findByText('Sin toques desde esa fecha')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
