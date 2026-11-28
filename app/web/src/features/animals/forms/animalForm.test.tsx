import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ActiveRanchProvider } from '../../../app/ActiveRanchProvider';
import type { Permission } from '../../../app/useActiveRanch';
import { SnackbarProvider } from '../../../ui/SnackbarProvider';
import { AuthContext, type AuthApi } from '../../auth/useAuth';
import { isBull, isHeifer, showsRepro, toCreateBody, defaultValues } from './formModel';
import { NewAnimalPage } from './NewAnimalPage';

const TODAY = new Date(2026, 10, 21, 9);
const GENERAL = 'a1a1a1a1-0000-4000-8000-00000000000a';
const CAROLA = 'c4c4c4c4-0000-4000-8000-000000000004';
const searchable = [
  {
    id: CAROLA,
    sex: 'HEMBRA',
    control_id: 'Carola 004',
    name: null,
    breed: 'HOLSTEIN',
    birth_date: '2016-05-23',
  },
  {
    id: 't-1',
    sex: 'MACHO',
    control_id: 'Carolo',
    name: null,
    breed: 'HOLSTEIN',
    birth_date: '2018-01-01',
  },
];

interface Call {
  method: string;
  path: string;
  query: URLSearchParams;
  body: unknown;
}
let calls: Call[];
let createResponse: () => Response;

const posts = () => calls.filter((c) => c.method === 'POST' && c.path === '/api/animals');
const sent = () => posts()[0]?.body;

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

function renderAt(path: string, permissions: Permission[] = ['ANIMALS_VIEW', 'ANIMALS_CREATE']) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <SnackbarProvider>
        <AuthContext.Provider value={authFor(permissions)}>
          <MemoryRouter initialEntries={[path]}>
            <ActiveRanchProvider>
              <Routes>
                <Route path="/vacas/nueva" element={<NewAnimalPage />} />
                <Route path="/vacas" element={<p>lista</p>} />
              </Routes>
              <Where />
            </ActiveRanchProvider>
          </MemoryRouter>
        </AuthContext.Provider>
      </SnackbarProvider>
    </QueryClientProvider>,
  );
}

function created(fields: Record<string, unknown>) {
  return {
    id: 'n-1',
    sex: 'HEMBRA',
    kind: 'VACA',
    control_id: 'NEW',
    created_ids: ['n-1'],
    ...fields,
  };
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ['Date'] });
  vi.setSystemTime(TODAY);
  calls = [];
  createResponse = () => Response.json(created({ control_id: 'V-100' }), { status: 201 });
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
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
          { id: GENERAL, name: 'General', type: 'PRESET', preset: 'GENERAL' },
          {
            id: 'b0b0b0b0-0000-4000-8000-00000000000b',
            name: 'Lote 7',
            type: 'CUSTOM',
            preset: null,
          },
          {
            id: 'c0c0c0c0-0000-4000-8000-00000000000c',
            name: 'Toros de monta',
            type: 'TORO',
            preset: null,
          },
          {
            id: 'b0b0b0b0-0000-4000-8000-00000000000c',
            name: 'Jerseys',
            type: 'CUSTOM',
            preset: null,
            selection: 'AUTO',
          },
        ]);
      if (key === 'GET /api/animals')
        return Response.json({
          items: searchable.filter((a) => a.sex === url.searchParams.get('sex')),
          total: 1,
          page: 1,
          page_size: 20,
        });
      if (key === 'POST /api/animals') return createResponse();
      return new Response(null, { status: 404 });
    }),
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const user = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

async function fillRequired(id: string, birth: string) {
  await user().type(screen.getByRole('textbox', { name: /Nombre o Número interno/ }), id);
  await user().type(screen.getByRole('textbox', { name: /Fecha nacimiento/ }), birth);
}

async function choose(
  combobox: string | RegExp,
  option: string | RegExp,
  scope: Pick<typeof screen, 'getByRole'> = screen,
) {
  await user().click(scope.getByRole('combobox', { name: combobox }));
  await user().click(await screen.findByRole('option', { name: option }));
}

describe('quick registration', () => {
  it('registers a female with only her ID and birth date, on the General group', async () => {
    renderAt('/vacas/nueva');
    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: 'Potrero' })).toHaveTextContent('General'),
    );
    expect(screen.getByRole('radio', { name: 'Hembra' })).toBeChecked();
    await fillRequired('V-100', '15012022');
    await user().click(screen.getByRole('button', { name: 'Registrar' }));

    await waitFor(() => expect(posts()).toHaveLength(1));
    expect(sent()).toMatchObject({
      sex: 'HEMBRA',
      control_id: 'V-100',
      birth_date: '2022-01-15',
      breed: 'HOLSTEIN',
      group_id: GENERAL,
      crossbreed_level: 'FB',
      contributing_breed: null,
      development_stage: 'AUTO',
      siniiga: null,
      repro_stage: null,
    });
    // Untouched: the API's age-based default applies.
    expect(sent()).toHaveProperty('lactation_number', null);
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent(/^\/vacas$/));
  });

  it('offers no AUTO potrero, which picks its own cows', async () => {
    renderAt('/vacas/nueva');
    const potrero = await screen.findByRole('combobox', { name: 'Potrero' });
    await waitFor(() => expect(potrero).toBeEnabled());
    await user().click(potrero);
    expect(await screen.findByRole('option', { name: 'Lote 7' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Jerseys' })).not.toBeInTheDocument();
    // A cow never goes into a bull group.
    expect(screen.queryByRole('option', { name: 'Toros de monta' })).not.toBeInTheDocument();
  });

  it('offers a male bull groups only, starting on none', async () => {
    renderAt('/vacas/nueva?tipo=toros');
    const potrero = await screen.findByRole('combobox', { name: 'Potrero' });
    await waitFor(() => expect(potrero).toBeEnabled());
    expect(potrero).toHaveTextContent('Sin grupo');
    await user().click(potrero);
    expect(await screen.findByRole('option', { name: 'Toros de monta' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'General' })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Lote 7' })).not.toBeInTheDocument();
  });

  it('registers a male, and goes to the bulls list', async () => {
    createResponse = () =>
      Response.json(created({ sex: 'MACHO', kind: 'TORO', control_id: 'T-9' }), { status: 201 });
    renderAt('/vacas/nueva?tipo=toros');
    expect(screen.getByRole('radio', { name: 'Macho' })).toBeChecked();
    await fillRequired('T-9', '01032024');
    await user().click(screen.getByRole('button', { name: 'Registrar' }));

    await waitFor(() => expect(posts()).toHaveLength(1));
    expect(sent()).toMatchObject({
      sex: 'MACHO',
      control_id: 'T-9',
      birth_date: '2024-03-01',
      // Quick mode: the bull is on the ranch unless said otherwise.
      bull_availability: 'EN_RANCHO',
    });
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/vacas?tipo=toros'));
  });

  it('marks the required fields and shows the toast instead of sending', async () => {
    renderAt('/vacas/nueva');
    await user().click(screen.getByRole('button', { name: 'Registrar' }));
    expect(await screen.findAllByText('Este campo es obligatorio')).toHaveLength(2);
    expect(screen.getByText('Por favor, llena los datos solicitados')).toBeInTheDocument();
    expect(posts()).toHaveLength(0);
  });

  it('puts an API refusal under its field', async () => {
    createResponse = () =>
      Response.json(
        {
          detail: [
            { loc: ['body', 'control_id'], type: 'control_id_taken', msg: 'Ese ID ya existe' },
          ],
        },
        { status: 409 },
      );
    renderAt('/vacas/nueva');
    await fillRequired('V-1', '15012022');
    await user().click(screen.getByRole('button', { name: 'Registrar' }));
    expect(await screen.findByText('Ese ID ya existe')).toBeInTheDocument();
    expect(screen.getByTestId('where')).toHaveTextContent('/vacas/nueva');
  });
});

describe('detailed registration', () => {
  it('requires a contributing breed for an F2 cross', async () => {
    renderAt('/vacas/nueva');
    await fillRequired('V-2', '15012020');
    await user().click(screen.getByRole('button', { name: 'Tengo más datos de mi animal' }));
    expect(screen.getByRole('combobox', { name: /Raza de aporte/ })).toBeDisabled();
    await choose('Nivel de cruza', /F2/);
    await user().click(screen.getByRole('button', { name: 'Registrar' }));
    expect(await screen.findByText('Este campo es obligatorio')).toBeInTheDocument();
    expect(posts()).toHaveLength(0);

    await choose(/Raza de aporte/, 'Pardo Suizo');
    await user().click(screen.getByRole('button', { name: 'Registrar' }));
    await waitFor(() => expect(posts()).toHaveLength(1));
    expect(sent()).toMatchObject({
      crossbreed_level: 'F2',
      contributing_breed: 'PARDO_SUIZO',
    });
  });

  it.each([
    ['Solo semen', 'SEMEN'],
    ['Ambos', 'AMBOS'],
    ['En rancho', 'EN_RANCHO'],
  ])('registers a bull as %s', async (label, value) => {
    createResponse = () =>
      Response.json(created({ sex: 'MACHO', kind: 'TORO', control_id: 'T-9' }), { status: 201 });
    renderAt('/vacas/nueva?tipo=toros');
    await fillRequired('T-9', '01032020');
    await user().click(screen.getByRole('button', { name: 'Tengo más datos de mi animal' }));
    expect(screen.getByRole('combobox', { name: /Disponibilidad/ })).toHaveTextContent('En rancho');
    await choose(/Disponibilidad/, label);
    await user().click(screen.getByRole('button', { name: 'Registrar' }));

    await waitFor(() => expect(posts()).toHaveLength(1));
    expect(sent()).toMatchObject({ sex: 'MACHO', bull_availability: value });
  });

  it('asks a female for no availability', async () => {
    renderAt('/vacas/nueva');
    await fillRequired('V-3', '15012022');
    await user().click(screen.getByRole('button', { name: 'Tengo más datos de mi animal' }));
    expect(screen.queryByRole('combobox', { name: /Disponibilidad/ })).not.toBeInTheDocument();
    await user().click(screen.getByRole('button', { name: 'Registrar' }));

    await waitFor(() => expect(posts()).toHaveLength(1));
    expect(sent()).not.toHaveProperty('bull_availability');
  });

  it('switches the stage list with the sex', async () => {
    renderAt('/vacas/nueva');
    await user().click(screen.getByRole('button', { name: 'Tengo más datos de mi animal' }));
    await user().click(screen.getByRole('combobox', { name: 'Etapa de desarrollo' }));
    expect(await screen.findByRole('option', { name: /Novilla/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Toro/ })).not.toBeInTheDocument();
    await user().keyboard('{Escape}');
    await user().click(screen.getByRole('radio', { name: 'Macho' }));
    await user().click(screen.getByRole('combobox', { name: 'Etapa de desarrollo' }));
    expect(await screen.findByRole('option', { name: /Toro/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Novilla/ })).not.toBeInTheDocument();
  });

  it('shows the reproductive section for an adult female and sends it', async () => {
    renderAt('/vacas/nueva');
    await fillRequired('V-3', '15012020');
    await user().click(screen.getByRole('button', { name: 'Tengo más datos de mi animal' }));
    expect(screen.getByRole('heading', { name: 'Información reproductiva' })).toBeInTheDocument();
    const lactation = screen.getByRole('textbox', { name: 'Ciclo de lactancia' });
    expect(lactation).toHaveValue('');
    expect(lactation).toHaveAttribute('placeholder', '1');
    await user().type(lactation, '2');
    expect(screen.getByRole('combobox', { name: 'Etapa reproductiva' })).toHaveTextContent(
      'Ninguna',
    );
    expect(screen.getByRole('textbox', { name: 'Fecha etapa reproductiva' })).toBeDisabled();
    await user().type(screen.getByRole('textbox', { name: 'Último parto' }), '01092026');
    await choose('Etapa reproductiva', 'Preñada');
    await user().type(
      screen.getByRole('textbox', { name: 'Fecha etapa reproductiva' }),
      '01112026',
    );
    await user().click(screen.getByRole('button', { name: 'Registrar' }));
    await waitFor(() => expect(posts()).toHaveLength(1));
    expect(sent()).toMatchObject({
      last_calving_date: '2026-09-01',
      lactation_number: 2,
      repro_stage: 'GESTANTE',
      repro_stage_date: '2026-11-01',
    });
  });

  it('hides the reproductive section for a young female', async () => {
    renderAt('/vacas/nueva');
    await fillRequired('V-4', '15012026');
    await user().click(screen.getByRole('button', { name: 'Tengo más datos de mi animal' }));
    expect(
      screen.queryByRole('heading', { name: 'Información reproductiva' }),
    ).not.toBeInTheDocument();
  });
});

describe('parents', () => {
  it('registers a heifer with a newly typed dam, sold for slaughter', async () => {
    createResponse = () =>
      Response.json(created({ kind: 'VAQUILLA', control_id: 'VQ-1', created_ids: ['d', 'n-1'] }), {
        status: 201,
      });
    renderAt('/vacas/nueva', ['ANIMALS_VIEW', 'ANIMALS_CREATE', 'ANIMALS_DELETE']);
    await fillRequired('VQ-1', '15012026');
    await user().click(screen.getByRole('button', { name: 'Tengo más datos de mi animal' }));
    await user().click(screen.getByRole('button', { name: 'Madre' }));

    const dialog = await screen.findByRole('dialog', { name: 'Datos de la vaca madre' });
    await user().type(
      within(dialog).getByRole('textbox', { name: /Nombre o Número interno/ }),
      'Vacalactica',
    );
    await user().type(
      within(dialog).getByRole('textbox', { name: /Fecha nacimiento/ }),
      '23052017',
    );
    await user().click(within(dialog).getByRole('button', { name: 'Registrar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Madre: Vacalactica' })).toBeInTheDocument();
    expect(posts()).toHaveLength(0);

    await user().click(screen.getByRole('button', { name: 'Registrar' }));
    const status = await screen.findByRole('dialog', { name: 'Estatus vaca madre' });
    expect(posts()).toHaveLength(0);
    await choose('Estatus', 'Vendida al rastro', within(status));
    await user().click(within(status).getByRole('button', { name: 'Registrar' }));

    await waitFor(() => expect(posts()).toHaveLength(1));
    expect(sent()).toMatchObject({
      control_id: 'VQ-1',
      dam: {
        control_id: 'Vacalactica',
        birth_date: '2017-05-23',
        breed: 'HOLSTEIN',
        crossbreed_level: 'FB',
        development_stage: 'AUTO',
      },
      dam_status: 'VENDIDA_RASTRO',
    });
    await waitFor(() =>
      expect(screen.getByTestId('where')).toHaveTextContent('/vacas?tipo=vaquillas'),
    );
  });

  it('finds an existing dam by ID; only females are offered', async () => {
    renderAt('/vacas/nueva');
    await fillRequired('V-5', '15012020');
    await user().click(screen.getByRole('button', { name: 'Tengo más datos de mi animal' }));
    await user().click(screen.getByRole('button', { name: 'Madre' }));
    const dialog = await screen.findByRole('dialog', { name: 'Datos de la vaca madre' });
    await user().type(within(dialog).getByRole('searchbox', { name: 'Buscar' }), 'Carol');
    await user().click(within(dialog).getByRole('button', { name: 'Buscar' }));
    const hit = await within(dialog).findByRole('button', { name: /Carola 004/ });
    expect(within(dialog).queryByRole('button', { name: /Carolo/ })).not.toBeInTheDocument();
    expect(calls.find((c) => c.path === '/api/animals')?.query.get('sex')).toBe('HEMBRA');
    await user().click(hit);

    // An adult cow: no dam-status question.
    await user().click(screen.getByRole('button', { name: 'Registrar' }));
    await waitFor(() => expect(posts()).toHaveLength(1));
    expect(sent()).toMatchObject({ dam_id: CAROLA });
    expect(sent()).not.toHaveProperty('dam_status');
  });
});

describe('review cases', () => {
  it('keeps a typed dam and a cross when the extra data is collapsed', async () => {
    renderAt('/vacas/nueva');
    await fillRequired('VQ-2', '15012026');
    await user().click(screen.getByRole('button', { name: 'Tengo más datos de mi animal' }));
    await choose('Nivel de cruza', /F1/);
    await user().click(screen.getByRole('button', { name: 'Madre' }));
    const dialog = await screen.findByRole('dialog', { name: 'Datos de la vaca madre' });
    await user().type(
      within(dialog).getByRole('textbox', { name: /Nombre o Número interno/ }),
      'M-1',
    );
    await user().type(
      within(dialog).getByRole('textbox', { name: /Fecha nacimiento/ }),
      '01012018',
    );
    await user().click(within(dialog).getByRole('button', { name: 'Registrar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await user().click(screen.getByRole('button', { name: 'Tengo menos datos de mi animal' }));

    // The cross still needs its breed: the section opens again to show why.
    await user().click(screen.getByRole('button', { name: 'Registrar' }));
    expect(await screen.findByRole('combobox', { name: /Raza de aporte/ })).toBeInTheDocument();
    expect(screen.getByText('Este campo es obligatorio')).toBeInTheDocument();
    await choose(/Raza de aporte/, 'Jersey');
    await user().click(screen.getByRole('button', { name: 'Tengo menos datos de mi animal' }));
    await user().click(screen.getByRole('button', { name: 'Registrar' }));
    const status = await screen.findByRole('dialog', { name: 'Estatus vaca madre' });
    await user().click(within(status).getByRole('button', { name: 'Registrar' }));
    await waitFor(() => expect(posts()).toHaveLength(1));
    expect(sent()).toMatchObject({
      crossbreed_level: 'F1',
      contributing_breed: 'JERSEY',
      dam: { control_id: 'M-1' },
      dam_status: 'VIVA',
    });
  });

  it('offers only "Viva en producción" to someone who cannot remove animals', async () => {
    renderAt('/vacas/nueva', ['ANIMALS_VIEW', 'ANIMALS_CREATE']);
    await fillRequired('VQ-3', '15012026');
    await user().click(screen.getByRole('button', { name: 'Tengo más datos de mi animal' }));
    await user().click(screen.getByRole('button', { name: 'Madre' }));
    const dialog = await screen.findByRole('dialog', { name: 'Datos de la vaca madre' });
    await user().type(within(dialog).getByRole('searchbox', { name: 'Buscar' }), 'Carol');
    await user().click(within(dialog).getByRole('button', { name: 'Buscar' }));
    await user().click(await within(dialog).findByRole('button', { name: /Carola 004/ }));
    await user().click(screen.getByRole('button', { name: 'Registrar' }));
    const status = await screen.findByRole('dialog', { name: 'Estatus vaca madre' });
    await user().click(within(status).getByRole('combobox', { name: 'Estatus' }));
    expect(await screen.findAllByRole('option')).toHaveLength(1);
  });

  it('returns a calf to the list it came from', async () => {
    createResponse = () =>
      Response.json(created({ sex: 'MACHO', kind: 'BECERRO', control_id: 'B-1' }), { status: 201 });
    renderAt('/vacas/nueva?tipo=vaquillas');
    await user().click(screen.getByRole('radio', { name: 'Macho' }));
    await fillRequired('B-1', '01112026');
    await user().click(screen.getByRole('button', { name: 'Registrar' }));
    await waitFor(() =>
      expect(screen.getByTestId('where')).toHaveTextContent('/vacas?tipo=vaquillas'),
    );
  });

  it('checks the lactation number', async () => {
    renderAt('/vacas/nueva');
    await fillRequired('V-9', '15012020');
    await user().click(screen.getByRole('button', { name: 'Tengo más datos de mi animal' }));
    const lactation = screen.getByRole('textbox', { name: 'Ciclo de lactancia' });
    await user().clear(lactation);
    await user().type(lactation, '45');
    await user().click(screen.getByRole('button', { name: 'Registrar' }));
    expect(await screen.findByText('Escribe un número entero de 0 a 30')).toBeInTheDocument();
    expect(posts()).toHaveLength(0);
  });

  it('ignores a bad lactation number once the reproductive section no longer applies', async () => {
    renderAt('/vacas/nueva');
    await fillRequired('V-10', '15012020');
    await user().click(screen.getByRole('button', { name: 'Tengo más datos de mi animal' }));
    await user().type(screen.getByRole('textbox', { name: 'Ciclo de lactancia' }), '45');
    await user().click(screen.getByRole('radio', { name: 'Macho' }));
    await user().click(screen.getByRole('button', { name: 'Registrar' }));
    await waitFor(() => expect(posts()).toHaveLength(1));
    expect(sent()).toMatchObject({ sex: 'MACHO' });
    expect(sent()).not.toHaveProperty('lactation_number');
  });
});

describe('form model', () => {
  it('takes a male for a bull, who goes in bull groups, from 24 months or his stage', () => {
    expect(isBull('MACHO', 'AUTO', '2020-01-01', TODAY)).toBe(true);
    expect(isBull('MACHO', 'AUTO', '', TODAY)).toBe(true);
    expect(isBull('MACHO', 'TORO', '2026-01-01', TODAY)).toBe(true);
    // A young male keeps the cow potreros, as before bull groups.
    expect(isBull('MACHO', 'AUTO', '2026-01-01', TODAY)).toBe(false);
    expect(isBull('MACHO', 'NOVILLO', '2020-01-01', TODAY)).toBe(false);
    expect(isBull('HEMBRA', 'AUTO', '2020-01-01', TODAY)).toBe(false);
  });

  it('shows the reproductive section by sex, stage and age', () => {
    expect(showsRepro('MACHO', 'AUTO', '2018-01-01', TODAY)).toBe(false);
    expect(showsRepro('HEMBRA', 'NOVILLA', '2018-01-01', TODAY)).toBe(false);
    expect(showsRepro('HEMBRA', 'AUTO', '2026-01-01', TODAY)).toBe(false);
    expect(showsRepro('HEMBRA', 'AUTO', '2024-01-01', TODAY)).toBe(true);
    expect(showsRepro('HEMBRA', 'CARGADA', '', TODAY)).toBe(true);
    expect(isHeifer({ sex: 'HEMBRA', developmentStage: 'TERNERA', birthDate: '' })).toBe(true);
  });

  it('sends a male no reproductive data, no stage from the female list, and no dam status without a dam', () => {
    const values = {
      ...defaultValues('MACHO'),
      controlId: ' T-1 ',
      birthDate: '2020-01-01',
      developmentStage: 'NOVILLA', // left over from the female list
      lastCalvingDate: '2024-01-01',
      siniiga: '1012345678',
    };
    const body = toCreateBody(values, { dam: null, sire: null, damStatus: 'VIVA', today: TODAY });
    expect(body).toMatchObject({
      control_id: 'T-1',
      development_stage: 'AUTO',
      siniiga: '1012345678',
    });
    expect(body).not.toHaveProperty('last_calving_date');
    expect(body).not.toHaveProperty('lactation_number');
    expect(body).not.toHaveProperty('dam_status');
  });
});
