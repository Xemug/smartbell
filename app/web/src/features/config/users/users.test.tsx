import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ActiveRanchProvider } from '../../../app/ActiveRanchProvider';
import { activeRanchKey, type Permission, type Role } from '../../../app/useActiveRanch';
import { SnackbarProvider } from '../../../ui/SnackbarProvider';
import { GuestOnly } from '../../auth/guards';
import { AuthContext, type AuthApi } from '../../auth/useAuth';
import { InvitationPage } from './InvitationPage';
import { invitationPath, pendingInvitation, rememberInvitation } from './invitationLink';
import { EditUserPage, NewUserPage } from './UserFormPage';
import { UsersPage } from './UsersPage';

const ALL: Permission[] = [
  'ANIMALS_CREATE',
  'ANIMALS_VIEW',
  'ANIMALS_EDIT',
  'ANIMALS_DELETE',
  'GROUPS_CREATE',
  'GROUPS_VIEW_EDIT',
  'GROUPS_DELETE',
  'USERS_ADD',
  'USERS_VIEW',
  'USERS_EDIT',
  'USERS_DELETE',
  'DEVICES_ADD_VIEW',
  'DEVICES_ASSIGN',
  'DEVICES_DELETE',
  'EVENTS_RECORD',
  'REPORTS_VIEW',
  'REPORTS_EXPORT',
  'SINIIGA',
  'FINANCES',
  'DECLARATION_SEND',
  'BILLING',
];
const MEDICO: Permission[] = [
  'ANIMALS_CREATE',
  'ANIMALS_VIEW',
  'ANIMALS_EDIT',
  'ANIMALS_DELETE',
  'GROUPS_CREATE',
  'GROUPS_VIEW_EDIT',
  'GROUPS_DELETE',
  'USERS_VIEW',
  'DEVICES_ADD_VIEW',
  'DEVICES_ASSIGN',
  'EVENTS_RECORD',
  'REPORTS_VIEW',
  'REPORTS_EXPORT',
];
const NUTRIOLOGO: Permission[] = [
  'ANIMALS_VIEW',
  'ANIMALS_EDIT',
  'GROUPS_VIEW_EDIT',
  'USERS_VIEW',
  'EVENTS_RECORD',
  'REPORTS_VIEW',
  'REPORTS_EXPORT',
];
const presets = [
  { role: 'DUENO', permissions: ALL },
  {
    role: 'ADMINISTRADOR',
    permissions: ALL.filter(
      (c) => !['USERS_DELETE', 'SINIIGA', 'DECLARATION_SEND', 'BILLING'].includes(c),
    ),
  },
  { role: 'MEDICO', permissions: MEDICO },
  { role: 'NUTRIOLOGO', permissions: NUTRIOLOGO },
  { role: 'TECNICO_CAMPO', permissions: ['ANIMALS_VIEW', 'USERS_VIEW'] },
];

const owner = {
  user_id: 'u-owner',
  first_name: 'Ana',
  last_name: 'López',
  email: 'ana@example.com',
  photo_url: null,
  last_active_at: '2026-11-18T10:00:00Z',
  role: 'DUENO',
  permissions: ALL,
  is_owner: true,
};
const vet = {
  user_id: 'u-vet',
  first_name: 'Juan',
  last_name: 'Pérez',
  email: 'juan@example.com',
  photo_url: null,
  last_active_at: null,
  role: 'MEDICO',
  permissions: MEDICO,
  is_owner: false,
};

interface Call {
  method: string;
  path: string;
  body: unknown;
}
let calls: Call[];
let hasPro: boolean;
let overrides: Record<string, () => Response>;
let desktop: boolean;

function authFor(role: Role, permissions: Permission[], userId = 'u-owner'): AuthApi {
  const noop = vi.fn(async () => {});
  return {
    state: {
      status: 'signedIn',
      account: {
        user: {
          id: userId,
          first_name: 'Ana',
          last_name: null,
          email: 'ana@example.com',
          phone: null,
          photo_url: null,
        },
        ranches: [{ id: 'ranch-1', name: 'Rancho San José', role, permissions }],
      },
      created: false,
    },
    signIn: noop,
    signUp: noop,
    signInWith: noop,
    resetPassword: noop,
    sendVerificationEmail: vi.fn(async () => {}),
    refreshIdentity: vi.fn(async () => {}),
    signOut: noop,
    retry: vi.fn(),
  };
}

const signedOut: AuthApi = {
  ...authFor('DUENO', ALL),
  state: { status: 'signedOut' },
};

function renderAt(path: string, auth: AuthApi = authFor('DUENO', ALL)) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <SnackbarProvider>
        <AuthContext.Provider value={auth}>
          <MemoryRouter initialEntries={[path]}>
            <Routes>
              <Route path="/invitacion/:token" element={<InvitationPage />} />
              <Route element={<GuestOnly />}>
                <Route path="/entrar" element={<p>login</p>} />
              </Route>
              <Route path="/" element={<p>home</p>} />
              <Route
                path="/config/usuarios/*"
                element={
                  <ActiveRanchProvider>
                    <Routes>
                      <Route index element={<UsersPage />} />
                      <Route path="nuevo" element={<NewUserPage />} />
                      <Route path=":userId" element={<EditUserPage />} />
                    </Routes>
                  </ActiveRanchProvider>
                }
              />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      </SnackbarProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  calls = [];
  hasPro = true;
  overrides = {};
  desktop = false;
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: desktop, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
  localStorage.clear();
  sessionStorage.clear();
  vi.stubGlobal(
    'fetch',
    vi.fn(async (request: Request) => {
      const path = new URL(request.url).pathname;
      const text = await request.text();
      calls.push({ method: request.method, path, body: text ? JSON.parse(text) : null });
      const key = `${request.method} ${path}`;
      if (overrides[key]) return overrides[key]();
      if (key === 'GET /api/ranch/plan') return Response.json({ has_pro: hasPro });
      if (key === 'GET /api/ranch/members') return Response.json([owner, vet]);
      if (key === 'GET /api/ranch/invitations') return Response.json([]);
      if (key === 'GET /api/role-presets') return Response.json(presets);
      if (key === 'POST /api/ranch/invitations')
        return Response.json(
          {
            id: 'inv-1',
            email: 'nutri@example.com',
            first_name: 'Sebastián',
            last_name: null,
            role: 'NUTRIOLOGO',
            permissions: ['ANIMALS_VIEW'],
            created_at: '2026-11-19T00:00:00Z',
            expires_at: '2026-11-26T00:00:00Z',
            token: 'tok-123',
          },
          { status: 201 },
        );
      if (key.startsWith('DELETE /api/ranch/members/')) return new Response(null, { status: 204 });
      if (key.startsWith('PATCH /api/ranch/members/')) return Response.json(vet);
      if (key === 'GET /api/invitations/tok-123')
        return Response.json({
          ranch_name: 'Rancho San José',
          invited_by: 'Ana',
          email: 'ana@example.com',
          role: 'MEDICO',
          status: 'pending',
        });
      if (key === 'POST /api/invitations/tok-123/accept')
        return Response.json({ ranch_id: 'ranch-9' });
      return Response.json({ detail: 'not_stubbed' }, { status: 500 });
    }),
  );
});

describe('UsersPage', () => {
  it('lists members with role and actions only for the members the owner may change', async () => {
    renderAt('/config/usuarios');

    const table = await screen.findByRole('table');
    expect(screen.getByText('Usuarios en sistema | 2')).toBeInTheDocument();
    expect(within(table).getByText('Dueño del rancho')).toBeInTheDocument();
    expect(within(table).getByText('Médico')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Editar a Juan Pérez' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dar de baja a Juan Pérez' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Editar a Ana López' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Agregar Usuario' })).toBeInTheDocument();
  });

  it('removes a user after the confirmation that says their history is kept', async () => {
    renderAt('/config/usuarios');

    await userEvent.click(await screen.findByRole('button', { name: 'Dar de baja a Juan Pérez' }));
    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveTextContent('su historial se mantendrá en registro');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Dar de baja' }));

    await waitFor(() =>
      expect(calls).toContainEqual({
        method: 'DELETE',
        path: '/api/ranch/members/u-vet',
        body: null,
      }),
    );
    expect(await screen.findByText('Se dio de baja a Juan Pérez')).toBeInTheDocument();
  });

  it('shows no edit or delete to a Médico, and no add button', async () => {
    renderAt('/config/usuarios', authFor('MEDICO', MEDICO, 'u-other'));

    await screen.findByRole('table');
    expect(screen.queryByRole('button', { name: /Editar a/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Dar de baja a/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Agregar Usuario' })).not.toBeInTheDocument();
  });

  it('shows the upsell instead of the add button without Pro', async () => {
    hasPro = false;
    renderAt('/config/usuarios');

    expect(await screen.findByText('Agregar usuarios es parte del plan Pro')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Agregar Usuario' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver planes' })).toHaveAttribute(
      'href',
      expect.stringContaining('wa.me'),
    );
  });
});

describe('NewUserPage', () => {
  it('shows the upsell, not the form, without Pro', async () => {
    hasPro = false;
    renderAt('/config/usuarios/nuevo');

    expect(await screen.findByText('Agregar usuarios es parte del plan Pro')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Crear Usuario' })).not.toBeInTheDocument();
  });

  it('starts from the role preset, locks codes the role cannot have, and needs one permission', async () => {
    renderAt('/config/usuarios/nuevo');

    await userEvent.click(await screen.findByRole('tab', { name: 'Personalizar permisos' }));
    const addCows = screen.getByRole('switch', { name: 'Agregar vacas al sistema' });
    expect(addCows).toBeChecked(); // The Médico preset.
    expect(screen.getByRole('button', { name: 'Crear Usuario' })).toBeEnabled();

    await userEvent.click(screen.getByRole('tab', { name: 'Usuarios' }));
    expect(screen.getByRole('switch', { name: 'Eliminar usuarios' })).toBeDisabled();

    // Switch every allowed code off: create is disabled until one is chosen again.
    for (const tab of ['Ganado', 'Usuarios', 'Dispositivos', 'Salud', 'Reportes']) {
      await userEvent.click(screen.getByRole('tab', { name: tab }));
      for (const toggle of screen.getAllByRole('switch')) {
        if (toggle.getAttribute('aria-checked') === 'true') await userEvent.click(toggle);
      }
    }
    expect(screen.getByRole('button', { name: 'Crear Usuario' })).toBeDisabled();
    expect(screen.getByText('Selecciona al menos un permiso')).toBeInTheDocument();
  });

  it('invites with the chosen role and codes, then shows the link to share', async () => {
    renderAt('/config/usuarios/nuevo');

    await userEvent.type(await screen.findByLabelText('Nombre(s) *'), 'Sebastián');
    await userEvent.type(screen.getByLabelText('Correo Electrónico *'), 'nutri@example.com');
    await userEvent.click(screen.getByRole('combobox', { name: 'Tipo de usuario' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Nutriólogo' }));
    await userEvent.click(screen.getByRole('button', { name: 'Crear Usuario' }));

    expect(await screen.findByText('¡Invitación lista!')).toBeInTheDocument();
    const post = calls.find((c) => c.method === 'POST' && c.path === '/api/ranch/invitations');
    expect(post?.body).toEqual({
      first_name: 'Sebastián',
      last_name: null,
      phone: null,
      email: 'nutri@example.com',
      role: 'NUTRIOLOGO',
      permissions: NUTRIOLOGO,
    });
    expect(screen.getByDisplayValue(/\/invitacion\/tok-123$/)).toBeInTheDocument();
  });

  it('creates from the permissions tab, and a missing field brings the general tab back', async () => {
    renderAt('/config/usuarios/nuevo');

    await userEvent.click(await screen.findByRole('tab', { name: 'Personalizar permisos' }));
    await userEvent.click(screen.getByRole('button', { name: 'Crear Usuario' }));

    expect(await screen.findAllByText('Este campo es obligatorio')).toHaveLength(2);
    expect(screen.getByRole('tab', { name: 'Datos Generales' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await userEvent.type(screen.getByLabelText('Nombre(s) *'), 'Juan');
    await userEvent.type(screen.getByLabelText('Correo Electrónico *'), 'juan2@example.com');
    await userEvent.click(screen.getByRole('tab', { name: 'Personalizar permisos' }));
    await userEvent.click(screen.getByRole('button', { name: 'Crear Usuario' }));

    expect(await screen.findByText('¡Invitación lista!')).toBeInTheDocument();
  });

  it('shows general data and permissions side by side on the web layout', async () => {
    desktop = true;
    renderAt('/config/usuarios/nuevo');

    expect(await screen.findByLabelText('Nombre(s) *')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Agregar vacas al sistema' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Datos Generales' })).not.toBeInTheDocument();
  });

  it('explains a refusal from the API', async () => {
    overrides['POST /api/ranch/invitations'] = () =>
      Response.json({ detail: 'already_member' }, { status: 409 });
    renderAt('/config/usuarios/nuevo');

    await userEvent.type(await screen.findByLabelText('Nombre(s) *'), 'Juan');
    await userEvent.type(screen.getByLabelText('Correo Electrónico *'), 'juan@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Crear Usuario' }));

    expect(await screen.findByText('Esta persona ya trabaja en tu rancho.')).toBeInTheDocument();
  });
});

describe('load failures', () => {
  it('offers a retry when the plan fails to load, instead of spinning', async () => {
    overrides['GET /api/ranch/plan'] = () => Response.json({ detail: 'boom' }, { status: 500 });
    renderAt('/config/usuarios/nuevo');

    expect(await screen.findByText('No pudimos cargar los usuarios.')).toBeInTheDocument();
    delete overrides['GET /api/ranch/plan'];
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('button', { name: 'Crear Usuario' })).toBeInTheDocument();
  });

  it('says the list failed, not that the user is gone, when members fail on edit', async () => {
    overrides['GET /api/ranch/members'] = () => Response.json({ detail: 'boom' }, { status: 500 });
    renderAt('/config/usuarios/u-vet');

    expect(await screen.findByText('No pudimos cargar los usuarios.')).toBeInTheDocument();
    expect(screen.queryByText('Este usuario ya no está en tu rancho.')).not.toBeInTheDocument();
  });
});

describe('EditUserPage', () => {
  it('saves the role and the toggled codes', async () => {
    renderAt('/config/usuarios/u-vet');

    await userEvent.click(await screen.findByRole('tab', { name: 'Personalizar permisos' }));
    await userEvent.click(screen.getByRole('switch', { name: 'Agregar vacas al sistema' }));
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() =>
      expect(calls.find((c) => c.method === 'PATCH')?.body).toEqual({
        role: 'MEDICO',
        permissions: MEDICO.filter((c) => c !== 'ANIMALS_CREATE'),
      }),
    );
  });
});

describe('InvitationPage', () => {
  it('shows who invites, remembers the link and offers sign-up when signed out', async () => {
    renderAt('/invitacion/tok-123', signedOut);

    expect(
      await screen.findByText('Ana te invita a trabajar en Rancho San José como Médico.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Crear cuenta' })).toHaveAttribute('href', '/registro');
    expect(pendingInvitation()).toBe('tok-123');
  });

  it('accepts when signed in, opens the joined ranch and reloads the account', async () => {
    const auth = authFor('DUENO', ALL);
    renderAt('/invitacion/tok-123', auth);

    await userEvent.click(await screen.findByRole('button', { name: 'Aceptar invitación' }));

    expect(await screen.findByText('home')).toBeInTheDocument();
    expect(localStorage.getItem(activeRanchKey('u-owner'))).toBe('ranch-9');
    expect(auth.retry).toHaveBeenCalled();
    expect(pendingInvitation()).toBeNull();
  });

  it('says whose invite it is when the signed-in email differs', async () => {
    overrides['POST /api/invitations/tok-123/accept'] = () =>
      Response.json({ detail: 'email_mismatch' }, { status: 403 });
    rememberInvitation('tok-123');
    renderAt('/invitacion/tok-123');

    await userEvent.click(await screen.findByRole('button', { name: 'Aceptar invitación' }));

    expect(
      await screen.findByText(
        'Esta invitación es para ana@example.com. Entra con ese correo para aceptarla.',
      ),
    ).toBeInTheDocument();
    expect(pendingInvitation()).toBeNull();
  });

  it('asks an unconfirmed email to confirm, then accepts with a fresh token', async () => {
    let verified = false;
    overrides['POST /api/invitations/tok-123/accept'] = () =>
      verified
        ? Response.json({ ranch_id: 'ranch-9' })
        : Response.json({ detail: 'email_unverified' }, { status: 403 });
    const auth = authFor('DUENO', ALL);
    auth.refreshIdentity = vi.fn(async () => {
      verified = true;
    });
    rememberInvitation('tok-123');
    renderAt('/invitacion/tok-123', auth);

    await userEvent.click(await screen.findByRole('button', { name: 'Aceptar invitación' }));
    await userEvent.click(
      await screen.findByRole('button', { name: 'Enviar enlace de confirmación' }),
    );
    expect(auth.sendVerificationEmail).toHaveBeenCalled();
    expect(await screen.findByText('Enlace enviado. Revisa tu correo.')).toBeInTheDocument();
    expect(pendingInvitation()).toBe('tok-123'); // Not a dead end: the invite stays.
    await userEvent.click(screen.getByRole('button', { name: 'Ya confirmé mi correo' }));

    expect(await screen.findByText('home')).toBeInTheDocument();
    expect(auth.refreshIdentity).toHaveBeenCalled();
  });

  it('sends a just-signed-in invitee back to the invite', async () => {
    rememberInvitation('tok-123');
    renderAt('/entrar');

    expect(await screen.findByRole('button', { name: 'Aceptar invitación' })).toBeInTheDocument();
    expect(invitationPath('a b')).toBe('/invitacion/a%20b');
  });
});
