import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ActiveRanchProvider } from '../../../app/ActiveRanchProvider';
import type { Permission } from '../../../app/useActiveRanch';
import { SnackbarProvider } from '../../../ui/SnackbarProvider';
import { AuthContext, type AuthApi } from '../../auth/useAuth';
import { AnimalListPage } from './AnimalListPage';

const TODAY = new Date(2026, 10, 21, 9);
const ALTA = 'a1a1a1a1-0000-4000-8000-000000000001';

function animal(id: string, fields: Record<string, unknown> = {}) {
  return {
    id,
    sex: 'HEMBRA',
    kind: 'VACA',
    control_id: id.toUpperCase(),
    name: null,
    siniiga: null,
    birth_date: '2022-01-15',
    breed: 'HOLSTEIN',
    crossbreed_level: 'FB',
    contributing_breed: null,
    development_stage: 'AUTO',
    photo_url: null,
    group_id: null,
    status: 'ACTIVE',
    removed_reason: null,
    removed_at: null,
    dam_id: null,
    sire_id: null,
    birth_length_cm: null,
    weight_birth_kg: null,
    weight_weaning_kg: null,
    weight_one_year_kg: null,
    repro_state: 'ABIERTA',
    lactation_state: 'LACTANDO',
    lactation_number: 2,
    last_calving_date: '2026-11-01',
    last_heat_date: null,
    last_service_date: null,
    service_number_in_lactation: null,
    pregnancy_confirmed_date: null,
    expected_calving_date: null,
    is_sick: false,
    sick_since: null,
    milk_withdrawal_until: null,
    ...fields,
  };
}

const herd = [
  animal('v-001', { breed: 'JERSEY', group_id: ALTA }),
  animal('v-002', { lactation_state: 'SECA', repro_state: 'GESTANTE' }),
];
const bulls = [
  animal('t-001', {
    kind: 'TORO',
    sex: 'MACHO',
    name: 'Cadillac',
    siniiga: 'MX-01-23-4567-8901',
    birth_date: '2024-05-21',
    lactation_state: null,
    repro_state: null,
  }),
];

interface Call {
  method: string;
  path: string;
  query: URLSearchParams;
  body: unknown;
}
let calls: Call[];
let desktop: boolean;
let listed: (query: URLSearchParams) => unknown[];

const animalCalls = () =>
  calls.filter(
    (c) => c.method === 'GET' && c.path === '/api/animals' && c.query.get('page_size') !== '1',
  );
const lastQuery = () => animalCalls().at(-1)?.query;

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

function renderAt(
  path: string,
  permissions: Permission[] = ['ANIMALS_VIEW', 'ANIMALS_CREATE', 'ANIMALS_DELETE'],
) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <SnackbarProvider>
        <AuthContext.Provider value={authFor(permissions)}>
          <MemoryRouter initialEntries={[path]}>
            <ActiveRanchProvider>
              <Routes>
                <Route path="/vacas" element={<AnimalListPage />} />
                <Route path="/vacas/:id" element={<p>perfil</p>} />
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
  desktop = true;
  listed = (query) => {
    const kind = query.get('kind');
    if (kind === 'TORO') return bulls;
    if (kind !== 'VACA') return [];
    if (query.get('breed') === 'NORMANDO') return [];
    return herd;
  };
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
        query: url.searchParams,
        body: text ? JSON.parse(text) : null,
      });
      const key = `${request.method} ${url.pathname}`;
      if (key === 'GET /api/groups')
        return Response.json([
          { id: ALTA, name: 'Alta producción', type: 'PRESET', preset: 'ALTA_PRODUCCION' },
          {
            id: 'c0c0c0c0-0000-4000-8000-000000000002',
            name: 'Lote 7',
            type: 'CUSTOM',
            preset: null,
          },
        ]);
      if (key === 'GET /api/animals') {
        const items = listed(url.searchParams);
        return Response.json({
          items: url.searchParams.get('page_size') === '1' ? items.slice(0, 1) : items,
          total: items.length,
          page: Number(url.searchParams.get('page') ?? 1),
          page_size: Number(url.searchParams.get('page_size') ?? 10),
        });
      }
      if (request.method === 'POST' && url.pathname.endsWith('/removal')) {
        if (url.pathname.includes('v-002'))
          return Response.json({ detail: 'animal_in_use' }, { status: 409 });
        return Response.json(animal('x', { status: 'REMOVED' }));
      }
      return new Response(null, { status: 404 });
    }),
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('Vacas tab', () => {
  it('lists the cows with breed, state, DIM and group name', async () => {
    renderAt('/vacas');

    const table = await screen.findByRole('table', { name: 'Vacas' });
    const first = (await within(table).findByRole('link', { name: 'V-001' })).closest(
      'tr',
    ) as HTMLElement;
    expect(within(first).getByText('Jersey')).toBeInTheDocument();
    expect(within(first).getByText('Lactando')).toBeInTheDocument();
    expect(within(first).getByText('20')).toBeInTheDocument(); // Calved Nov 1.
    expect(await within(first).findByText('Alta producción')).toBeInTheDocument();
    const second = within(table).getByRole('link', { name: 'V-002' }).closest('tr') as HTMLElement;
    expect(within(second).getByText('Seca')).toBeInTheDocument();
    expect(within(second).getByText('General')).toBeInTheDocument(); // No group.
    expect(lastQuery()?.get('kind')).toBe('VACA');
    expect(await screen.findByRole('tab', { name: /Vacas · 002/ })).toBeInTheDocument();
  });

  it('reads the filter from the URL, so a reload keeps it', async () => {
    renderAt('/vacas?filtro=raza&valor=NORMANDO');

    expect(
      await screen.findByText('No encontramos animales con el filtro aplicado'),
    ).toBeInTheDocument();
    expect(lastQuery()?.get('breed')).toBe('NORMANDO');
    expect(screen.getByText('Filtro: Raza · Normando')).toBeInTheDocument();
  });

  it('applies a filter from the mobile sheet and writes it to the URL', async () => {
    desktop = false;
    const user = userEvent.setup();
    renderAt('/vacas');
    await screen.findByRole('link', { name: 'V-001' });

    await user.click(screen.getByRole('button', { name: 'Filtros disponibles' }));
    await user.click(await screen.findByRole('radio', { name: 'Salud' }));
    await user.click(screen.getByRole('radio', { name: 'Enfermas' }));
    await user.click(screen.getByRole('button', { name: 'Aplicar filtro' }));

    await waitFor(() => expect(lastQuery()?.get('health')).toBe('ENFERMA'));
    expect(screen.getByTestId('where')).toHaveTextContent('/vacas?filtro=salud&valor=ENFERMA');
  });

  it('searches by ID once typing pauses', async () => {
    const user = userEvent.setup();
    renderAt('/vacas');
    await screen.findByRole('link', { name: 'V-001' });

    await user.type(screen.getByRole('searchbox', { name: 'Buscar vaca por ID' }), '001');

    await waitFor(() => expect(lastQuery()?.get('q')).toBe('001'));
    expect(animalCalls().filter((c) => c.query.get('q')).length).toBe(1);
    expect(screen.getByTestId('where')).toHaveTextContent('/vacas?q=001');
  });

  it('sorts on the server and keeps the sort in the URL', async () => {
    const user = userEvent.setup();
    renderAt('/vacas');
    await screen.findByRole('link', { name: 'V-001' });

    await user.click(screen.getByRole('button', { name: /DIM/ }));
    await waitFor(() => expect(lastQuery()?.get('sort')).toBe('-last_calving_date'));
    await user.click(screen.getByRole('button', { name: /DIM/ }));
    await waitFor(() => expect(lastQuery()?.get('sort')).toBe('last_calving_date'));
    expect(screen.getByTestId('where')).toHaveTextContent('orden=dim%3Adesc');
  });

  it('shows the bulls with name, age and SINIIGA, and their Edad filter', async () => {
    const user = userEvent.setup();
    renderAt('/vacas');
    await user.click(await screen.findByRole('tab', { name: /Toros/ }));

    const table = await screen.findByRole('table', { name: 'Toros' });
    expect(await within(table).findByText('Cadillac')).toBeInTheDocument();
    expect(within(table).getByText('MX-01-23-4567-8901')).toBeInTheDocument();
    expect(within(table).getByText('30 meses')).toBeInTheDocument();
    expect(screen.getByTestId('where')).toHaveTextContent('/vacas?tipo=toros');

    await user.click(screen.getByRole('combobox', { name: 'Categoría' }));
    const options = (await screen.findAllByRole('option')).map((o) => o.textContent);
    expect(options).toEqual(['Raza', 'Edad', 'Bajas']);
  });

  it('removes the selected animals with a reason and reports the ones refused', async () => {
    const user = userEvent.setup();
    renderAt('/vacas');
    await screen.findByRole('link', { name: 'V-001' });

    await user.click(screen.getByRole('checkbox', { name: 'Seleccionar los de esta página' }));
    await user.click(screen.getByRole('button', { name: 'Dar de baja' }));
    const dialog = await screen.findByRole('dialog', { name: 'Dar de baja 2 animales' });
    const confirm = within(dialog).getByRole('button', { name: 'Dar de baja' });
    expect(confirm).toBeDisabled();
    await user.click(within(dialog).getByRole('radio', { name: 'Muerte' }));
    await user.click(confirm);

    await waitFor(() =>
      expect(calls.filter((c) => c.method === 'POST').map((c) => [c.path, c.body])).toEqual([
        ['/api/animals/v-001/removal', { reason: 'MUERTE' }],
        ['/api/animals/v-002/removal', { reason: 'MUERTE' }],
      ]),
    );
    expect(await screen.findByText('No pudimos dar de baja a V-002.')).toBeInTheDocument();
  });

  it('hides removal and add for a user without those permissions', async () => {
    renderAt('/vacas', ['ANIMALS_VIEW']);
    await screen.findByRole('link', { name: 'V-001' });

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Dar de baja/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Agregar Vaca' })).not.toBeInTheDocument();
  });
});
