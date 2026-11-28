import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ActiveRanchProvider } from '../../../app/ActiveRanchProvider';
import type { Permission } from '../../../app/useActiveRanch';
import { SnackbarProvider } from '../../../ui/SnackbarProvider';
import { AuthContext, type AuthApi } from '../../auth/useAuth';
import { EventLauncherProvider } from '../../events/EventLauncher';
import type { AnimalDetail, AnimalEvent, BullService } from './api';
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
let services: BullService[];
let deleteStatus: number;
let removed: boolean;
let postFails: boolean;

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

const ALL: Permission[] = [
  'ANIMALS_VIEW',
  'ANIMALS_EDIT',
  'ANIMALS_DELETE',
  'EVENTS_RECORD',
  'REPORTS_VIEW',
];

const potrero = (id: string, name: string, fields: Record<string, unknown> = {}) => ({
  id,
  name,
  description: null,
  type: 'CUSTOM',
  preset: null,
  selection: 'MANUAL',
  auto_filter: null,
  kpi_indicator: null,
  animal_count: 0,
  kpi_value: null,
  ...fields,
});
const GROUPS = [
  potrero('g-general', 'General', { type: 'PRESET', preset: 'GENERAL' }),
  potrero('g-norte', 'Lote norte'),
  potrero('g-auto', 'Primerizas', { selection: 'AUTO' }),
];

function renderAt(path: string, permissions: Permission[] = ALL) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <SnackbarProvider>
        <AuthContext.Provider value={authFor(permissions)}>
          <MemoryRouter initialEntries={[path]}>
            <ActiveRanchProvider>
              <EventLauncherProvider>
                <Routes>
                  <Route path="/vacas" element={<p>lista</p>} />
                  <Route path="/vacas/:id" element={<AnimalProfilePage />} />
                  <Route path="/vacas/:id/registros" element={<AnimalProfilePage records />} />
                </Routes>
                <Where />
              </EventLauncherProvider>
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
  postFails = false;
  services = [];
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
    event(
      'HEAT',
      {
        outcome: 'DIRTY_MEDICATED',
        clean: false,
        treatment: {
          type: 'ANTIBIOTICO',
          corticoid_subtype: null,
          presentation: 'INYECCION',
          start_date: '2026-08-10',
          duration_days: 5,
          withdrawal_days: 3,
        },
      },
      { id: 'e-heat', occurred_on: '2026-08-10' },
    ),
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
      if (key === `GET /api/animals/${ID}/services`) return Response.json(services);
      if (key === 'GET /api/animals/b-1')
        return Response.json(
          detail({
            id: 'b-1',
            sex: 'MACHO',
            kind: 'TORO',
            control_id: 'TORO-1',
            name: 'Emperador',
          }),
        );
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
      if (key === 'GET /api/groups') return Response.json(GROUPS);
      if (key === `POST /api/animals/${ID}/events`) {
        if (postFails) return Response.json({ detail: 'boom' }, { status: 500 });
        const body = JSON.parse(text) as { payload: { type: string; to_group_id?: string } };
        if (body.payload.type === 'HEAT') {
          events = [
            event('HEAT', body.payload, { id: 'e-new', occurred_on: '2026-11-26' }),
            ...events,
          ];
          return Response.json({ animal: cow, open_alerts: [] }, { status: 201 });
        }
        cow = { ...cow, group_id: body.payload.to_group_id ?? null };
        return Response.json({ animal: cow, open_alerts: [] }, { status: 201 });
      }
      if (key === `PATCH /api/animals/${ID}`) {
        cow = { ...cow, ...(JSON.parse(text) as Partial<AnimalDetail>) };
        return Response.json(cow);
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

describe('her potrero', () => {
  it('moves her to another manual potrero with a GROUP_CHANGE, never to an AUTO one', async () => {
    renderAt(`/vacas/${ID}`);
    expect(await screen.findByText('General')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cambiar potrero' }));

    const dialog = await screen.findByRole('dialog', { name: 'Cambiar de potrero' });
    await userEvent.click(within(dialog).getByRole('combobox'));
    expect(await screen.findByRole('option', { name: 'General (actual)' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.queryByRole('option', { name: /Primerizas/ })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('option', { name: 'Lote norte' }));
    expect(
      within(dialog).getByText('La vaca 00001 se moverá al potrero Lote norte.'),
    ).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Mover' }));

    await waitFor(() =>
      expect(calls.find((c) => c.method === 'POST')?.body).toEqual({
        occurred_on: '2026-11-26',
        payload: { type: 'GROUP_CHANGE', to_group_id: 'g-norte' },
      }),
    );
    expect(await screen.findByText('Lote norte')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    // The profile, the bitácora and the potrero lists are read again.
    await waitFor(() =>
      expect(calls.filter((c) => c.path === '/api/groups').length).toBeGreaterThan(1),
    );
  });

  it('is not offered to a user who may not record events', async () => {
    renderAt(`/vacas/${ID}`, ['ANIMALS_VIEW']);
    expect(await screen.findByText('Potrero')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cambiar potrero' })).not.toBeInTheDocument();
  });

  it('is not shown on a heifer: heifers move by age', async () => {
    cow = detail({ id: ID, kind: 'VAQUILLA', lactation_state: null, birth_date: '2025-05-26' });
    renderAt(`/vacas/${ID}`);
    await screen.findByText('Edad');
    expect(screen.queryByText('Potrero')).not.toBeInTheDocument();
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

describe('a bull', () => {
  const served = (cowId: string, controlId: string, on: string, method: 'IA' | 'MONTA') => ({
    event_id: `s-${controlId}`,
    occurred_on: on,
    method,
    cow_id: cowId,
    cow_control_id: controlId,
  });

  beforeEach(() => {
    cow = detail({
      id: ID,
      sex: 'MACHO',
      kind: 'TORO',
      control_id: 'TORO-1',
      lactation_state: null,
      bull_availability: 'EN_RANCHO',
    });
    services = [
      served('c-2', '00020', '2026-11-06', 'MONTA'),
      served('c-1', '00012', '2026-10-17', 'IA'),
    ];
  });

  it('shows his last service, never a calving, and lists the cows he served', async () => {
    renderAt(`/vacas/${ID}`);
    const repro = await screen.findByRole('region', { name: 'Reproducción' });
    expect(within(repro).getByText('Último servicio')).toBeInTheDocument();
    expect(await within(repro).findByText('06/11/2026')).toBeInTheDocument();
    expect(screen.queryByText('Último parto')).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Dieta' })).toBeInTheDocument();

    await userEvent.click(within(repro).getByRole('link', { name: 'Consultar historial' }));
    expect(screen.getByTestId('where')).toHaveTextContent(`/vacas/${ID}/registros?tab=servicios`);
    const table = await screen.findByRole('table', { name: 'Servicios del toro' });
    expect(within(table).getByRole('link', { name: '00020' })).toHaveAttribute(
      'href',
      '/vacas/c-2',
    );
    expect(within(table).getByText('Monta natural')).toBeInTheDocument();
    expect(within(table).getByText('Inseminación artificial')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Bitácora' })).toBeInTheDocument();
  });

  it('kept only as semen shows his genealogy and services, nothing to log', async () => {
    cow = { ...cow, bull_availability: 'SEMEN' };
    renderAt(`/vacas/${ID}`);
    await screen.findByRole('region', { name: 'Reproducción' });
    expect(screen.getByRole('region', { name: 'Genealogía' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Dieta' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Salud' })).not.toBeInTheDocument();
    expect(screen.queryByText('Peso')).not.toBeInTheDocument();
    expect(screen.getByText('Edad')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: 'Registros' }));
    expect(await screen.findByRole('tab', { name: 'Servicios' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.queryByRole('tab', { name: 'Bitácora' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: '00012' })).toBeInTheDocument();
  });

  it('switches to Solo semen only after confirming, and back without asking', async () => {
    renderAt(`/vacas/${ID}`);
    expect(await screen.findByText('En rancho')).toBeInTheDocument();
    expect(screen.queryByText('Potrero')).not.toBeInTheDocument();
    const patches = () => calls.filter((c) => c.method === 'PATCH');

    await userEvent.click(screen.getByRole('button', { name: 'Cambiar disponibilidad' }));
    let picker = await screen.findByRole('dialog', { name: 'Disponibilidad del toro' });
    await userEvent.click(within(picker).getByRole('radio', { name: 'Solo semen' }));
    await userEvent.click(within(picker).getByRole('button', { name: 'Guardar' }));
    let confirm = await screen.findByRole('alertdialog', {
      name: '¿Dejar al toro TORO-1 solo como semen?',
    });
    expect(confirm).toHaveTextContent(/sus registros quedarán congelados/);
    await userEvent.click(within(confirm).getByRole('button', { name: 'Cancelar' }));
    expect(patches()).toHaveLength(0);

    picker = await screen.findByRole('dialog', { name: 'Disponibilidad del toro' });
    await userEvent.click(within(picker).getByRole('button', { name: 'Guardar' }));
    confirm = await screen.findByRole('alertdialog');
    await userEvent.click(within(confirm).getByRole('button', { name: 'Sí, solo semen' }));
    await waitFor(() => expect(patches()).toHaveLength(1));
    expect(patches()[0]?.body).toEqual({ bull_availability: 'SEMEN' });
    expect(await screen.findByText('Solo semen')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Salud' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Cambiar disponibilidad' }));
    picker = await screen.findByRole('dialog', { name: 'Disponibilidad del toro' });
    await userEvent.click(within(picker).getByRole('radio', { name: 'Ambos' }));
    await userEvent.click(within(picker).getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(patches()).toHaveLength(2));
    expect(patches()[1]?.body).toEqual({ bull_availability: 'AMBOS' });
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(await screen.findByRole('region', { name: 'Salud' })).toBeInTheDocument();
  });

  it('hides Cambiar from a user who may not edit animals', async () => {
    renderAt(`/vacas/${ID}`, ['ANIMALS_VIEW', 'EVENTS_RECORD']);
    expect(await screen.findByText('En rancho')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Cambiar disponibilidad' }),
    ).not.toBeInTheDocument();
  });

  it('says so when he has served no cow yet', async () => {
    services = [];
    renderAt(`/vacas/${ID}/registros?tab=servicios`);
    expect(await screen.findByText(/aún no tiene servicios/)).toBeInTheDocument();
  });
});

describe('the bitácora', () => {
  it('names the bull and the method of a service', async () => {
    events = [
      event(
        'HEAT',
        { outcome: 'INSEMINATED', clean: true, bull_id: 'b-1', method: 'IA' },
        { id: 'e-service', occurred_on: '2026-10-02' },
      ),
    ];
    renderAt(`/vacas/${ID}/registros`);
    await userEvent.click(
      await screen.findByRole('button', { name: 'Celo confirmado: Inseminación' }),
    );
    const dialog = await screen.findByRole('dialog', { name: 'Detalle del evento' });
    expect(await within(dialog).findByRole('link', { name: 'TORO-1 · Emperador' })).toHaveAttribute(
      'href',
      '/vacas/b-1',
    );
    expect(within(dialog).getByText('Inseminación artificial')).toBeInTheDocument();
  });

  it('says which potrero she left and which she went to', async () => {
    events = [
      event(
        'GROUP_CHANGE',
        { from_group_id: null, to_group_id: 'g-norte' },
        { id: 'e-move', occurred_on: '2026-11-20' },
      ),
      event(
        'GROUP_CHANGE',
        { from_group_id: 'g-norte', to_group_id: 'g-gone', to_group_name: 'Lote sur' },
        { id: 'e-move-2', occurred_on: '2026-11-25' },
      ),
    ];
    renderAt(`/vacas/${ID}/registros`);
    const moves = await screen.findAllByRole('button', { name: 'Cambio de potrero' });
    expect(moves).toHaveLength(2);
    const [first, latest] = moves as [HTMLElement, HTMLElement];
    await userEvent.click(first);
    let dialog = await screen.findByRole('dialog', { name: 'Detalle del evento' });
    // No potrero before is General.
    expect(await within(dialog).findByText('General')).toBeInTheDocument();
    expect(within(dialog).getByText('De potrero')).toBeInTheDocument();
    expect(within(dialog).getByText('Lote norte')).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: /cerrar|close/i }));

    await userEvent.click(latest);
    dialog = await screen.findByRole('dialog', { name: 'Detalle del evento' });
    expect(await within(dialog).findByText('Lote norte')).toBeInTheDocument();
    expect(within(dialog).getByText('Lote sur (Potrero eliminado)')).toBeInTheDocument();
  });

  it('shows no Eliminar on a repro event', async () => {
    renderAt(`/vacas/${ID}/registros`);
    await userEvent.click(
      await screen.findByRole('button', { name: 'Parto dentro de lo esperado' }),
    );
    const dialog = await screen.findByRole('dialog', { name: 'Detalle del evento' });
    expect(within(dialog).queryByRole('button', { name: 'Eliminar' })).not.toBeInTheDocument();
    expect(within(dialog).getByText(/no se pueden eliminar/)).toBeInTheDocument();
  });

  it('shows the treatment recorded with a medicated heat', async () => {
    renderAt(`/vacas/${ID}/registros`);
    await userEvent.click(
      await screen.findByRole('button', { name: 'Celo sucio: con tratamiento' }),
    );
    const dialog = await screen.findByRole('dialog', { name: 'Detalle del evento' });
    const block = within(dialog).getByText('Tratamiento médico').closest('details');
    expect(block).not.toBeNull();
    const details = within(block as HTMLElement);
    expect(details.getByText('Antibiótico')).toBeInTheDocument();
    expect(details.getByText('Inyección')).toBeInTheDocument();
    expect(details.getByText('10/08/2026')).toBeInTheDocument();
    expect(details.getByText('5 días')).toBeInTheDocument();
    expect(details.getByText('3 días')).toBeInTheDocument();
  });

  it('shows no treatment block on an event without one', async () => {
    renderAt(`/vacas/${ID}/registros`);
    await userEvent.click(await screen.findByRole('button', { name: /Cambio de dieta/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Detalle del evento' });
    expect(within(dialog).queryByText('Tratamiento médico')).not.toBeInTheDocument();
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

describe('recording an event from the profile', () => {
  const reproCard = () => screen.findByRole('region', { name: 'Reproducción' });
  const saludCard = () => screen.findByRole('region', { name: 'Salud' });
  const registrar = /Registrar/;

  it('disables the reproduction entries outside her windows, saying when they open', async () => {
    cow = detail({
      id: ID,
      projection: { next_heat: { start: '2026-12-03', end: '2026-12-09' } },
    });
    renderAt(`/vacas/${ID}`);
    await userEvent.click(within(await reproCard()).getByRole('button', { name: registrar }));
    const sheet = await screen.findByRole('dialog', {
      name: 'Registrar evento de reproducción: Vaca 00001',
    });
    const celo = within(sheet).getByRole('button', { name: 'Celo' });
    expect(celo).toBeDisabled();
    expect(celo).toHaveAccessibleDescription('Disponible a partir del 3 dic');
    expect(within(sheet).getByRole('button', { name: 'Preñez' })).toHaveAccessibleDescription(
      'Fuera de los días estimados',
    );
    expect(within(sheet).getByRole('button', { name: 'Parto' })).toBeDisabled();
    expect(within(sheet).getByRole('button', { name: 'Aborto' })).toHaveAccessibleDescription(
      'Disponible pronto',
    );
  });

  it('says when a window already closed', async () => {
    cow = detail({
      id: ID,
      projection: { next_heat: { start: '2026-11-10', end: '2026-11-16' } },
    });
    renderAt(`/vacas/${ID}`);
    await userEvent.click(within(await reproCard()).getByRole('button', { name: registrar }));
    expect(await screen.findByRole('button', { name: 'Celo' })).toHaveAccessibleDescription(
      'Los días estimados terminaron el 16 nov',
    );
  });

  it('records a heat inside her window, confirms it and refreshes the profile', async () => {
    renderAt(`/vacas/${ID}`);
    await userEvent.click(within(await reproCard()).getByRole('button', { name: registrar }));
    await userEvent.click(await screen.findByRole('button', { name: 'Celo' }));
    const wizard = await screen.findByRole('dialog', { name: 'Registro de celo' });
    expect(within(wizard).getByRole('button', { name: 'Sí, confirmar' })).toBeDisabled();
    const reads = calls.filter((c) => c.method === 'GET' && c.path === `/api/animals/${ID}`).length;
    await userEvent.click(within(wizard).getByRole('button', { name: 'No entró' }));

    expect(await screen.findByText('Celo registrado')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Registro de celo' })).not.toBeInTheDocument(),
    );
    expect(calls).toContainEqual({
      method: 'POST',
      path: `/api/animals/${ID}/events`,
      body: { occurred_on: '2026-11-26', payload: { type: 'HEAT', outcome: 'NOT_OBSERVED' } },
    });
    expect(
      calls.filter((c) => c.method === 'GET' && c.path === `/api/animals/${ID}`).length,
    ).toBeGreaterThan(reads);
  });

  it('keeps the form open and says so when the save fails', async () => {
    postFails = true;
    renderAt(`/vacas/${ID}`);
    await userEvent.click(within(await reproCard()).getByRole('button', { name: registrar }));
    await userEvent.click(await screen.findByRole('button', { name: 'Celo' }));
    await userEvent.click(await screen.findByRole('button', { name: 'No entró' }));
    expect(await screen.findByText('Falla de conexión, intenta más tarde')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Registro de celo' })).toBeInTheDocument();
  });

  it('lists the health entries, still to come, on the Salud card', async () => {
    renderAt(`/vacas/${ID}`);
    await userEvent.click(within(await saludCard()).getByRole('button', { name: registrar }));
    const sheet = await screen.findByRole('dialog', {
      name: 'Registrar evento de salud: Vaca 00001',
    });
    for (const name of ['Enfermedad', 'Accidente', 'Tratamiento médico', 'Cambio de dieta'])
      expect(within(sheet).getByRole('button', { name })).toHaveAccessibleDescription(
        'Disponible pronto',
      );
  });

  it('gives a bull only the health card, and none to a semen-only one', async () => {
    cow = detail({ id: ID, sex: 'MACHO', kind: 'TORO', bull_availability: 'EN_RANCHO' });
    const { unmount } = renderAt(`/vacas/${ID}`);
    expect(within(await saludCard()).getByRole('button', { name: registrar })).toBeVisible();
    expect(within(await reproCard()).queryByRole('button', { name: registrar })).toBeNull();
    unmount();

    cow = detail({ id: ID, sex: 'MACHO', kind: 'TORO', bull_availability: 'SEMEN' });
    renderAt(`/vacas/${ID}`);
    expect(within(await reproCard()).queryByRole('button', { name: registrar })).toBeNull();
  });

  it('hides Registrar on a removed animal and without EVENTS_RECORD', async () => {
    cow = detail({ id: ID, status: 'REMOVED', removed_reason: 'VENTA_RASTRO' });
    const { unmount } = renderAt(`/vacas/${ID}`);
    expect(within(await saludCard()).queryByRole('button', { name: registrar })).toBeNull();
    unmount();

    cow = detail({ id: ID });
    renderAt(`/vacas/${ID}`, ['ANIMALS_VIEW']);
    expect(within(await saludCard()).queryByRole('button', { name: registrar })).toBeNull();
  });
});
