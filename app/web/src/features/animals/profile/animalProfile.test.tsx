import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ActiveRanchProvider } from '../../../app/ActiveRanchProvider';
import type { Permission } from '../../../app/useActiveRanch';
import { SnackbarProvider } from '../../../ui/SnackbarProvider';
import { AuthContext, type AuthApi } from '../../auth/useAuth';
import type { AnimalDetail, AnimalEvent } from './api';
import { AnimalProfilePage } from './AnimalProfilePage';
import { detail, event } from './testData';

const TODAY = new Date(2026, 10, 26, 9);
const ID = 'a-1';

interface Call {
  method: string;
  path: string;
  body: unknown;
}
let calls: Call[];
let desktop: boolean;
let cow: AnimalDetail;
let events: AnimalEvent[];
let deleteStatus: number;
let removed: boolean;

function authFor(permissions: Permission[]): AuthApi {
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
            permissions,
            is_owner: true,
            can_edit: true,
          },
        ],
        ranch_creation: 'upsell',
        is_admin: false,
      },
      created: false,
    },
    signIn: noop,
    signUp: noop,
    signInWith: noop,
    resetPassword: noop,
    sendVerificationEmail: noop,
    refreshAccount: noop,
    setUser: noop,
    canChangePassword: () => false,
    changePassword: noop,
    refreshIdentity: noop,
    signOut: noop,
    retry: vi.fn(),
  };
}

function Where() {
  const location = useLocation();
  return <output data-testid="where">{location.pathname + location.search}</output>;
}

const ALL: Permission[] = ['ANIMALS_VIEW', 'ANIMALS_DELETE', 'EVENTS_RECORD', 'REPORTS_VIEW'];

function renderAt(path: string, permissions: Permission[] = ALL) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <SnackbarProvider>
        <AuthContext.Provider value={authFor(permissions)}>
          <MemoryRouter initialEntries={[path]}>
            <ActiveRanchProvider>
              <Routes>
                <Route path="/vacas" element={<p>lista</p>} />
                <Route path="/vacas/:id" element={<AnimalProfilePage />} />
                <Route path="/vacas/:id/registros" element={<AnimalProfilePage records />} />
              </Routes>
              <Where />
            </ActiveRanchProvider>
          </MemoryRouter>
        </AuthContext.Provider>
      </SnackbarProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ['Date'] });
  vi.setSystemTime(TODAY);
  calls = [];
  desktop = false;
  deleteStatus = 200;
  removed = false;
  cow = detail({
    id: ID,
    is_sick: true,
    sick_since: '2026-11-21',
    projection: { dim: 60, next_heat: { start: '2026-11-26', end: '2026-12-02' } },
  });
  events = [
    event(
      'DIET_CHANGE',
      { reason: 'OTRA', diet: 'Materia seca alta en fibra', diet_type: 'Materia Seca' },
      { id: 'e-diet', occurred_on: '2026-11-16', recorded_by_name: 'Roberto Casablancas' },
    ),
    event('ILLNESS', { illness: 'MASTITIS' }, { id: 'e-ill', occurred_on: '2026-11-21' }),
    event('CALVING', { timing: 'ESPERADO' }, { id: 'e-calving', occurred_on: '2026-09-27' }),
    event('ALTA', {}, { id: 'e-alta', occurred_on: '2022-10-18' }),
  ];
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: desktop, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
  localStorage.clear();
  vi.stubGlobal(
    'fetch',
    vi.fn(async (request: Request) => {
      const url = new URL(request.url);
      const text = await request.text();
      calls.push({
        method: request.method,
        path: url.pathname,
        body: text ? JSON.parse(text) : null,
      });
      const key = `${request.method} ${url.pathname}`;
      // After an Error al registrar she is gone: her own reads 404.
      if (removed && url.pathname.includes(ID))
        return Response.json({ detail: 'animal_not_found' }, { status: 404 });
      if (key === `GET /api/animals/${ID}`) return Response.json(cow);
      if (key === `GET /api/animals/${ID}/events`) return Response.json(events);
      if (key === `GET /api/milk/cows/${ID}`)
        return Response.json({
          animal_id: ID,
          days_logged: 10,
          total_liters: '180.0',
          avg_daily_liters: '18.0',
          peak: null,
        });
      if (key === `DELETE /api/animals/${ID}/events/e-diet`) {
        if (deleteStatus === 202)
          return Response.json(
            {
              id: 'r-1',
              event_id: 'e-diet',
              requested_by: 'u-1',
              status: 'PENDING',
              created_at: '',
            },
            { status: 202 },
          );
        events = events.filter((e) => e.id !== 'e-diet');
        return Response.json({ animal: cow, open_alerts: [] });
      }
      if (key === `POST /api/animals/${ID}/removal`) {
        removed = true;
        return new Response(null, { status: 204 });
      }
      if (key === 'GET /api/support/config') return Response.json({});
      return Response.json({ detail: 'not_mocked' }, { status: 404 });
    }),
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('the profile', () => {
  it('shows the banners her projection implies and the MVP tiles', async () => {
    renderAt(`/vacas/${ID}`);
    const banners = await screen.findByTestId('profile-banners');
    expect(banners).toHaveTextContent(
      'Esta vaca lleva 5 días enferma. Evita ordeñar para producción.',
    );
    expect(banners).toHaveTextContent(
      'Celo estimado entre el 26 de noviembre y el 2 de diciembre de 2026.',
    );
    expect(screen.getByRole('heading', { name: /Vaca ID 00001/ })).toBeInTheDocument();
    expect(await screen.findByText('18 lt /día')).toBeInTheDocument();
    expect(screen.getByText('60 días')).toBeInTheDocument();
    expect(screen.getByText('Materia Seca')).toBeInTheDocument();
    expect(screen.getByText('Enferma')).toBeInTheDocument();
  });

  it('shows a heifer her age instead of DEL', async () => {
    cow = detail({ id: ID, kind: 'VAQUILLA', lactation_state: null, birth_date: '2025-05-26' });
    renderAt(`/vacas/${ID}`);
    expect(await screen.findByText('Edad')).toBeInTheDocument();
    expect(screen.queryByText('DEL')).not.toBeInTheDocument();
    expect(screen.getByText('18 meses')).toBeInTheDocument();
  });

  it('the Salud card opens the bitácora filtered to health events', async () => {
    renderAt(`/vacas/${ID}`);
    const salud = await screen.findByRole('region', { name: 'Salud' });
    await userEvent.click(within(salud).getByRole('link', { name: 'Consultar historial' }));
    expect(screen.getByTestId('where')).toHaveTextContent(`/vacas/${ID}/registros?tipo=salud`);
    const table = await screen.findByRole('table');
    expect(within(table).getByText('Enfermedad: Mastitis')).toBeInTheDocument();
    expect(within(table).queryByText(/Cambio de dieta/)).not.toBeInTheDocument();
  });
});

describe('the records', () => {
  it('falls back to the bitácora when a bull is sent to Producción', async () => {
    cow = detail({ id: ID, sex: 'MACHO', kind: 'TORO', lactation_state: null });
    renderAt(`/vacas/${ID}/registros?tab=produccion`);
    expect(await screen.findByRole('tab', { name: 'Bitácora' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.queryByRole('tab', { name: 'Producción' })).not.toBeInTheDocument();
  });
});

describe('the bitácora', () => {
  it('shows no Eliminar on a repro event', async () => {
    renderAt(`/vacas/${ID}/registros`);
    await userEvent.click(
      await screen.findByRole('button', { name: 'Parto dentro de lo esperado' }),
    );
    const dialog = await screen.findByRole('dialog', { name: 'Detalle del evento' });
    expect(within(dialog).queryByRole('button', { name: 'Eliminar' })).not.toBeInTheDocument();
    expect(within(dialog).getByText(/no se pueden eliminar/)).toBeInTheDocument();
  });

  it('deletes a diet change, which leaves the log', async () => {
    renderAt(`/vacas/${ID}/registros`);
    await userEvent.click(
      await screen.findByRole('button', { name: 'Cambio de dieta: Materia seca alta en fibra' }),
    );
    const dialog = await screen.findByRole('dialog', { name: 'Detalle del evento' });
    expect(within(dialog).getByText('Roberto Casablancas')).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Eliminar' }));
    const confirm = await screen.findByRole('alertdialog', { name: 'Eliminar evento en bitácora' });
    await userEvent.click(within(confirm).getByRole('button', { name: 'Sí, eliminar' }));

    expect(await screen.findByText('Evento en bitácora eliminado')).toBeInTheDocument();
    expect(calls.some((c) => c.method === 'DELETE' && c.path.endsWith('/events/e-diet'))).toBe(
      true,
    );
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /Cambio de dieta/ })).not.toBeInTheDocument(),
    );
  });

  it('says an admin will decide when the delete became a request', async () => {
    deleteStatus = 202;
    renderAt(`/vacas/${ID}/registros`);
    await userEvent.click(await screen.findByRole('button', { name: /Cambio de dieta/ }));
    await userEvent.click(await screen.findByRole('button', { name: 'Eliminar' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Sí, eliminar' }));
    expect(await screen.findByText(/Un administrador será notificado/)).toBeInTheDocument();
  });

  it('offers no Eliminar without the right to record events', async () => {
    renderAt(`/vacas/${ID}/registros`, ['ANIMALS_VIEW']);
    await userEvent.click(await screen.findByRole('button', { name: /Cambio de dieta/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Detalle del evento' });
    expect(within(dialog).queryByRole('button', { name: 'Eliminar' })).not.toBeInTheDocument();
  });

  it('filters by event type from the filter panel', async () => {
    renderAt(`/vacas/${ID}/registros`);
    await userEvent.click(await screen.findByRole('button', { name: 'Filtrar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Reproducción' }));
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar filtro' }));
    expect(screen.getByTestId('where')).toHaveTextContent('tipo=reproduccion');
    expect(screen.queryByRole('button', { name: /Cambio de dieta/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Parto dentro de lo esperado' })).toBeInTheDocument();
  });
});

describe('Baja', () => {
  it('Error al registrar deletes her and goes back to the list', async () => {
    renderAt(`/vacas/${ID}`);
    await userEvent.click(await screen.findByRole('button', { name: 'Eliminar' }));
    await userEvent.click(await screen.findByRole('radio', { name: 'Error al registrar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Dar de baja' }));
    expect(
      await screen.findByText(
        'La vaca 00001 se eliminará por completo del sistema, sin posibilidad de recuperarla',
      ),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Sí, dar de baja' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Entendido' }));

    expect(calls.find((c) => c.method === 'POST')).toMatchObject({
      path: `/api/animals/${ID}/removal`,
      body: { reason: 'ERROR_REGISTRO' },
    });
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent(/^\/vacas$/));
  });

  it('keeps the success dialog while her reads 404, until Entendido', async () => {
    renderAt(`/vacas/${ID}`);
    await userEvent.click(await screen.findByRole('button', { name: 'Eliminar' }));
    await userEvent.click(await screen.findByRole('radio', { name: 'Error al registrar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Dar de baja' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Sí, dar de baja' }));
    expect(await screen.findByText('La vaca 00001 se eliminó del sistema')).toBeInTheDocument();
    // Give any refetch time to land; the dialog must survive it.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.queryByText('Este animal ya no existe en el rancho.')).not.toBeInTheDocument();
    expect(calls.filter((c) => c.method === 'GET' && c.path === `/api/animals/${ID}`)).toHaveLength(
      1,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Entendido' }));
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent(/^\/vacas$/));
  });

  it('a removed animal shows why and offers no Eliminar', async () => {
    cow = detail({
      id: ID,
      status: 'REMOVED',
      removed_reason: 'VENTA_RASTRO',
      removed_at: '2026-11-20T12:00:00Z',
    });
    renderAt(`/vacas/${ID}`);
    expect(
      await screen.findByText('Dada de baja por venta a rastro el 20 de noviembre de 2026.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Eliminar' })).not.toBeInTheDocument();
  });
});
