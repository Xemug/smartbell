import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ActiveRanchProvider } from '../../app/ActiveRanchProvider';
import type { Permission } from '../../app/useActiveRanch';
import { SnackbarProvider } from '../../ui/SnackbarProvider';
import { AnimalListPage } from '../animals/list/AnimalListPage';
import { AuthContext, type AuthApi } from '../auth/useAuth';
import { GroupDetailPage } from './GroupDetailPage';
import { GroupsPage } from './GroupsPage';
import { HeiferGroupPage } from './HeiferGroupPage';
import { NewGroupPage } from './NewGroupPage';

const GENERAL = 'a0a0a0a0-0000-4000-8000-000000000001';
const LOTE = 'a0a0a0a0-0000-4000-8000-000000000002';
const ALL: Permission[] = [
  'ANIMALS_VIEW',
  'ANIMALS_CREATE',
  'ANIMALS_DELETE',
  'GROUPS_CREATE',
  'GROUPS_VIEW_EDIT',
  'GROUPS_DELETE',
];

function group(id: string, fields: Record<string, unknown> = {}) {
  return {
    id,
    name: 'Lote norte',
    description: null,
    type: 'CUSTOM',
    preset: null,
    selection: 'MANUAL',
    auto_filter: null,
    kpi_indicator: null,
    animal_count: 0,
    kpi_value: null,
    ...fields,
  };
}

const groups = [
  group(GENERAL, {
    name: 'General',
    type: 'PRESET',
    preset: 'GENERAL',
    animal_count: 5,
    kpi_indicator: 'EN_CELO',
    kpi_value: 2,
  }),
  group(LOTE, { animal_count: 3, kpi_indicator: 'DIM', kpi_value: 120 }),
];

function cow(id: string, groupId: string | null = null) {
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
    group_id: groupId,
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
    last_calving_date: '2026-06-01',
    last_heat_date: null,
    last_service_date: null,
    service_number_in_lactation: null,
    pregnancy_confirmed_date: null,
    expected_calving_date: null,
    is_sick: false,
    sick_since: null,
    milk_withdrawal_until: null,
  };
}
const herd = [cow('v-001'), cow('v-002'), cow('v-003'), cow('v-004', LOTE)];

interface Call {
  method: string;
  path: string;
  query: URLSearchParams;
  body: unknown;
}
let calls: Call[];
let desktop: boolean;

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

function renderAt(path: string, permissions: Permission[] = ALL) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <SnackbarProvider>
        <AuthContext.Provider value={authFor(permissions)}>
          <MemoryRouter initialEntries={[path]}>
            <ActiveRanchProvider>
              <Routes>
                <Route path="/vacas" element={<AnimalListPage />} />
                <Route path="/grupos" element={<GroupsPage />} />
                <Route path="/grupos/nuevo" element={<NewGroupPage />} />
                <Route path="/grupos/vaquillas/:key" element={<HeiferGroupPage />} />
                <Route path="/grupos/:id" element={<GroupDetailPage />} />
              </Routes>
              <Where />
            </ActiveRanchProvider>
          </MemoryRouter>
        </AuthContext.Provider>
      </SnackbarProvider>
    </QueryClientProvider>,
  );
}

/** The nth card, failing the test when it isn't there. */
function card(cards: HTMLElement[], index: number): HTMLElement {
  const found = cards[index];
  if (!found) throw new Error(`no card ${index}`);
  return found;
}

const writes = () => calls.filter((c) => c.method !== 'GET');

beforeEach(() => {
  calls = [];
  desktop = true;
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
      if (key === 'GET /api/groups') return Response.json(groups);
      if (key === `GET /api/groups/${LOTE}`) return Response.json(groups[1]);
      if (key === `GET /api/groups/${GENERAL}`) return Response.json(groups[0]);
      if (key === 'GET /api/groups/new-group')
        return Response.json(group('new-group', { name: 'Lote sur', animal_count: 3 }));
      if (key === 'GET /api/groups/heifers') {
        return Response.json([
          {
            key: 'RECIEN_NACIDAS',
            animals: [
              {
                id: 'h-1',
                control_id: 'H-1',
                breed: 'JERSEY',
                birth_date: '2026-09-01',
                repro_state: 'VAQUILLA',
                is_sick: false,
              },
            ],
          },
          { key: 'EN_DESARROLLO', animals: [] },
          { key: 'SERVIDAS', animals: [] },
          { key: 'PRENADAS', animals: [] },
          { key: 'ENFERMAS', animals: [] },
        ]);
      }
      if (key === 'POST /api/groups' || key === `PATCH /api/groups/${LOTE}`) {
        // The API answers a taken name (ignoring case) with the existing potrero's name.
        const wanted = (JSON.parse(text) as { name?: string }).name?.toLowerCase();
        const holder = groups.find((g) => g.name.toLowerCase() === wanted);
        if (holder && holder.id !== url.pathname.split('/').pop()) {
          return Response.json(
            {
              detail: [
                {
                  loc: ['body', 'name'],
                  type: 'group_name_taken',
                  msg: `Ya hay un potrero llamado «${holder.name}» en este rancho. Elige otro nombre.`,
                  ctx: { existing_name: holder.name },
                },
              ],
            },
            { status: 409 },
          );
        }
        if (key !== 'POST /api/groups') return Response.json(groups[1]);
      }
      if (key === 'POST /api/groups') {
        return Response.json(group('new-group', { name: 'Lote sur', animal_count: 3 }), {
          status: 201,
        });
      }
      if (key === `DELETE /api/groups/${LOTE}`) {
        return Response.json({ to_group_id: GENERAL, to_group: 'General', moved: 3 });
      }
      if (request.method === 'POST' && url.pathname.endsWith('/animals')) {
        const body = JSON.parse(text) as { animal_ids: string[] };
        return Response.json({ moved: body.animal_ids, unchanged: [] });
      }
      if (key === 'GET /api/animals') {
        const inGroup = url.searchParams.get('group');
        const items =
          inGroup === 'GENERAL'
            ? herd.filter((a) => a.group_id === null)
            : inGroup
              ? herd.filter((a) => a.group_id === inGroup)
              : herd;
        const size = Number(url.searchParams.get('page_size') ?? 10);
        return Response.json({ items: items.slice(0, size), total: items.length, page: 1 });
      }
      if (key === 'GET /api/support/config') {
        return Response.json({
          whatsapp_number: null,
          support_message: null,
          feature_message: null,
        });
      }
      return new Response(null, { status: 404 });
    }),
  );
});

describe('Grupos tab', () => {
  it('lists the cow potreros with their count and indicator', async () => {
    renderAt('/grupos');

    const cards = await screen.findAllByRole('listitem');
    expect(cards).toHaveLength(2);
    const general = within(card(cards, 0));
    expect(general.getByText('General')).toBeInTheDocument();
    expect(general.getByRole('group', { name: 'Vacas en potrero: 005' })).toBeInTheDocument();
    expect(general.getByText('Vacas en celo')).toBeInTheDocument();
    expect(general.getByText('002')).toBeInTheDocument();
    // General can't be deleted; a custom group can.
    expect(general.queryByRole('button', { name: /Eliminar/ })).not.toBeInTheDocument();
    const lote = within(card(cards, 1));
    expect(lote.getByText('Días en leche (DEL)')).toBeInTheDocument();
    expect(lote.getByRole('button', { name: 'Eliminar Lote norte' })).toBeInTheDocument();
  });

  it('deletes a potrero, sending its cows to General by default', async () => {
    renderAt('/grupos');
    await userEvent.click(await screen.findByRole('button', { name: 'Eliminar Lote norte' }));

    const dialog = await screen.findByRole('dialog', {
      name: 'El potrero Lote norte se eliminará',
    });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Eliminar potrero' }));

    await waitFor(() => expect(writes()).toHaveLength(1));
    const [call] = writes();
    expect(call?.method).toBe('DELETE');
    expect(call?.path).toBe(`/api/groups/${LOTE}`);
    expect(call?.query.get('to_group_id')).toBe(GENERAL);
    expect(
      await screen.findByText('Potrero eliminado. Ahora tus vacas están en el potrero General.'),
    ).toBeInTheDocument();
  });

  it('lists heifer potreros computed by age and state', async () => {
    renderAt('/grupos?tipo=vaquillas');

    const cards = await screen.findAllByRole('listitem');
    expect(cards.map((c) => within(c).getByRole('heading').textContent)).toEqual([
      'Recién nacidas',
      'En desarrollo',
      'Servidas',
      'Preñadas',
      'Enfermas',
    ]);
    expect(
      within(card(cards, 0)).getByRole('group', { name: 'Vaquillas en potrero: 001' }),
    ).toBeInTheDocument();
    expect(
      within(card(cards, 0)).queryByRole('button', { name: /Eliminar/ }),
    ).not.toBeInTheDocument();
    await userEvent.click(within(card(cards, 0)).getByRole('button', { name: /Ver más/ }));
    expect(screen.getByTestId('where')).toHaveTextContent('/grupos/vaquillas/RECIEN_NACIDAS');
    expect(await screen.findByRole('link', { name: 'H-1' })).toBeInTheDocument();
  });

  it('hides Agregar potrero without GROUPS_CREATE', async () => {
    renderAt('/grupos', ['ANIMALS_VIEW', 'GROUPS_VIEW_EDIT']);
    await screen.findAllByRole('listitem');
    expect(screen.queryByRole('button', { name: 'Agregar potrero' })).not.toBeInTheDocument();
  });
});

describe('New potrero wizard', () => {
  it('creates a manual potrero with three cows and its indicator', async () => {
    renderAt('/grupos/nuevo');

    await userEvent.type(await screen.findByLabelText(/Nombre del potrero/), 'Lote sur');
    await userEvent.click(screen.getByRole('button', { name: /Continuar/ }));

    await screen.findByRole('heading', { name: 'Método selección vacas' });
    const table = await screen.findByRole('table');
    for (const id of ['V-001', 'V-002', 'V-003']) {
      await userEvent.click(within(table).getByRole('checkbox', { name: new RegExp(id) }));
    }
    expect(screen.getByRole('group', { name: 'Vacas en potrero: 003' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Continuar/ }));

    await screen.findByRole('heading', { name: 'Selección de indicador' });
    await userEvent.click(screen.getByRole('radio', { name: /Vacas preñadas/ }));
    await userEvent.click(screen.getByRole('button', { name: /Agregar potrero/ }));

    await waitFor(() => expect(writes()).toHaveLength(1));
    expect(writes()[0]?.body).toEqual({
      name: 'Lote sur',
      description: null,
      selection: 'MANUAL',
      animal_ids: ['v-001', 'v-002', 'v-003'],
      kpi_indicator: 'PRENADAS',
    });
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/grupos/new-group'));
    // The new page says so at the top and keeps saying it until it's closed.
    expect(
      await screen.findByText('¡Listo! Acabas de agregar el potrero Lote sur a tu rancho virtual.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Regresar a potreros/ })).toHaveAttribute(
      'href',
      '/grupos',
    );
  });

  it('needs a name before going on', async () => {
    renderAt('/grupos/nuevo');
    await userEvent.click(await screen.findByRole('button', { name: /Continuar/ }));
    expect(await screen.findByText('Es necesario el nombre')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Datos generales' })).toBeInTheDocument();
  });

  it('says which potrero has the name, under the field, keeping the typing', async () => {
    renderAt('/grupos/nuevo');
    await userEvent.type(await screen.findByLabelText(/Nombre del potrero/), 'LOTE NORTE');
    await userEvent.click(screen.getByRole('button', { name: /Continuar/ }));
    await screen.findByRole('heading', { name: 'Método selección vacas' });
    await userEvent.click(screen.getByRole('button', { name: /Continuar/ }));
    await screen.findByRole('heading', { name: 'Selección de indicador' });
    await userEvent.click(screen.getByRole('button', { name: /Agregar potrero/ }));

    // Back on the first step, where the name can be changed.
    expect(
      await screen.findByText(
        'Ya hay un potrero llamado «Lote norte» en este rancho. Elige otro nombre.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Datos generales' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre del potrero/)).toHaveValue('LOTE NORTE');
    expect(screen.getByLabelText(/Nombre del potrero/)).toHaveAccessibleDescription(
      /Ya hay un potrero llamado «Lote norte»/,
    );
    expect(screen.getByTestId('where')).toHaveTextContent('/grupos/nuevo');
  });

  it('keeps the indicator off while the potrero has no cows', async () => {
    renderAt('/grupos/nuevo');
    await userEvent.type(await screen.findByLabelText(/Nombre del potrero/), 'Vacío');
    await userEvent.click(screen.getByRole('button', { name: /Continuar/ }));
    await screen.findByRole('heading', { name: 'Método selección vacas' });
    await userEvent.click(screen.getByRole('button', { name: /Continuar/ }));

    await screen.findByRole('heading', { name: 'Selección de indicador' });
    expect(
      screen.getByText('Agrega vacas al potrero para elegir un indicador.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Vacas preñadas/ })).toBeDisabled();
  });
});

describe('Potrero detail', () => {
  it('says which potrero has the name it was renamed to, under the field', async () => {
    renderAt(`/grupos/${LOTE}`);
    const field = await screen.findByLabelText(/Nombre del potrero/);
    await userEvent.clear(field);
    await userEvent.type(field, 'general');
    await userEvent.click(screen.getByRole('button', { name: /Guardar/ }));

    expect(
      await screen.findByText(
        'Ya hay un potrero llamado «General» en este rancho. Elige otro nombre.',
      ),
    ).toBeInTheDocument();
    expect(field).toHaveValue('general');
    expect(field).toHaveAccessibleDescription(/Ya hay un potrero llamado «General»/);
    expect(writes()).toEqual([expect.objectContaining({ method: 'PATCH' })]);
  });

  it('moves a cow to another potrero', async () => {
    renderAt(`/grupos/${LOTE}`);
    await userEvent.click(await screen.findByRole('button', { name: /Cambiar de potrero.*V-004/ }));

    const dialog = await screen.findByRole('dialog', { name: 'Movimiento de vacas' });
    await userEvent.click(within(dialog).getByRole('combobox'));
    await userEvent.click(await screen.findByRole('option', { name: 'General' }));
    expect(within(dialog).getByText('Se moverá 1 vaca al potrero General.')).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Mover' }));

    await waitFor(() => expect(writes()).toHaveLength(1));
    expect(writes()[0]?.path).toBe(`/api/groups/${GENERAL}/animals`);
    expect(writes()[0]?.body).toEqual({ animal_ids: ['v-004'] });
  });
});

describe('General detail', () => {
  it('lists the animals with no group too', async () => {
    renderAt(`/grupos/${GENERAL}`);
    expect(await screen.findByRole('link', { name: 'V-001' })).toBeInTheDocument();
    const listed = calls.filter((c) => c.path === '/api/animals' && c.query.has('group'));
    expect(listed.at(-1)?.query.get('group')).toBe('GENERAL');
  });
});

describe('Animal lists bulk move', () => {
  it('moves the selected cows to the potrero picked', async () => {
    renderAt('/vacas');
    await userEvent.click(await screen.findByRole('checkbox', { name: /V-001/ }));
    const table = screen.getByRole('table');
    await userEvent.click(within(table).getByRole('checkbox', { name: /V-002/ }));

    await userEvent.click(screen.getByRole('button', { name: 'Cambiar de potrero' }));
    const dialog = await screen.findByRole('dialog', { name: 'Movimiento de vacas' });
    await userEvent.click(within(dialog).getByRole('combobox'));
    await userEvent.click(await screen.findByRole('option', { name: 'Lote norte' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Mover' }));

    await waitFor(() => expect(writes()).toHaveLength(1));
    expect(writes()[0]?.path).toBe(`/api/groups/${LOTE}/animals`);
    expect(writes()[0]?.body).toEqual({ animal_ids: ['v-001', 'v-002'] });
  });

  it('offers no move on the heifer list: heifers are grouped by age', async () => {
    renderAt('/vacas?tipo=vaquillas', ['ANIMALS_VIEW', 'ANIMALS_DELETE', 'GROUPS_VIEW_EDIT']);
    const [first] = await screen.findAllByRole('checkbox', { name: /Seleccionar [A-Z]-\d/ });
    if (!first) throw new Error('the heifer list has no rows');
    await userEvent.click(first);
    expect(await screen.findByRole('button', { name: 'Dar de baja' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cambiar de potrero' })).not.toBeInTheDocument();
  });

  it('offers no move without GROUPS_VIEW_EDIT', async () => {
    renderAt('/vacas', ['ANIMALS_VIEW', 'ANIMALS_DELETE']);
    await userEvent.click(await screen.findByRole('checkbox', { name: /V-001/ }));
    expect(screen.queryByRole('button', { name: 'Cambiar de potrero' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dar de baja' })).toBeInTheDocument();
  });
});
