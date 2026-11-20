import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { appRoutes } from '../../app/appRoutes';
import { SnackbarProvider } from '../../ui/SnackbarProvider';
import { AuthProvider } from '../auth/AuthProvider';
import { AuthError, type AuthBackend } from '../auth/backend';

// Leaflet needs a real layout engine; the stub stands in for dragging the pin.
vi.mock('./ranch/RanchMap', () => ({
  default: ({
    pin,
    editable,
    onMove,
  }: {
    pin: { latitude: number; longitude: number } | null;
    editable: boolean;
    onMove: (pin: { latitude: number; longitude: number }) => void;
  }) => (
    <div>
      <p>{pin ? `pin ${pin.latitude},${pin.longitude}` : 'no pin'}</p>
      <button
        type="button"
        disabled={!editable}
        onClick={() => onMove({ latitude: 20.8123456789, longitude: -102.7651234 })}
      >
        drag pin
      </button>
    </div>
  ),
}));

// The OSM geocoder is a network call; each test says what it finds.
const geocode = vi.hoisted(() =>
  vi.fn<(address: string) => Promise<{ pin: Pin; exact: boolean } | null>>(),
);
vi.mock('./ranch/geocode', () => ({ geocodeAddress: geocode }));
type Pin = { latitude: number; longitude: number };

class FakeBackend implements AuthBackend {
  password = true;
  onChange(listener: (signedIn: boolean) => void) {
    queueMicrotask(() => listener(true));
    return () => {};
  }
  getToken = async () => 'token';
  signIn = vi.fn(async () => {});
  signUp = vi.fn(async () => {});
  signInWithProvider = vi.fn(async () => {});
  sendPasswordReset = vi.fn(async () => {});
  signOut = vi.fn(async () => {});
  sendEmailVerification = vi.fn(async () => {});
  refreshIdentity = vi.fn(async () => {});
  hasPassword = () => this.password;
  changePassword = vi.fn(async (current: string) => {
    if (current !== 'actual123') throw new AuthError('auth/invalid-credential');
  });
}

type Json = Record<string, unknown>;

interface Ranch extends Json {
  id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  role: string;
  permissions: string[];
  is_owner: boolean;
  can_edit: boolean;
}

function ranch(id: string, name: string, extra: Partial<Ranch> = {}): Ranch {
  return {
    id,
    name,
    address: null,
    latitude: null,
    longitude: null,
    role: 'DUENO',
    permissions: [],
    is_owner: true,
    can_edit: true,
    ...extra,
  };
}

interface Call {
  method: string;
  path: string;
  ranchHeader: string | null;
  contentType: string | null;
  body: unknown;
}

/** An in-memory API: what the page saves is what it reads back. */
class FakeApi {
  user: Json = {
    id: 'u1',
    first_name: 'Ana',
    last_name: null,
    email: 'ana@example.com',
    phone: '+523312345678',
    photo_url: null,
  };
  ranches: Ranch[] = [ranch('r1', 'Mi rancho')];
  ranchCreation = 'upsell';
  calls: Call[] = [];

  account() {
    return { user: this.user, ranches: this.ranches, ranch_creation: this.ranchCreation };
  }

  handle = async (request: Request): Promise<Response> => {
    const path = new URL(request.url).pathname;
    const contentType = request.headers.get('Content-Type');
    const text = contentType?.startsWith('application/json') ? await request.clone().text() : '';
    const body = text ? (JSON.parse(text) as Json) : null;
    const ranchHeader = request.headers.get('X-Ranch-Id');
    this.calls.push({ method: request.method, path, ranchHeader, contentType, body });
    const active = (this.ranches.find((r) => r.id === ranchHeader) ?? this.ranches[0]) as Ranch;

    if (path === '/api/auth/session') return Response.json({ ...this.account(), created: false });
    if (path === '/api/auth/me') return Response.json(this.account());
    if (path === '/api/users/me' && request.method === 'PATCH') {
      this.user = { ...this.user, ...body };
      return Response.json(this.user);
    }
    if (path === '/api/users/me/photo') {
      this.user = { ...this.user, photo_url: '/api/media/avatars/abc.png' };
      return Response.json(this.user);
    }
    if (path === '/api/ranch' && request.method === 'GET') {
      return Response.json({ ...active, animal_count: 45 });
    }
    if (path === '/api/ranch' && request.method === 'PATCH') {
      Object.assign(active, body ?? {});
      return Response.json({ ...active, animal_count: 45 });
    }
    if (path === '/api/ranch' && request.method === 'DELETE') {
      this.ranches = this.ranches.filter((r) => r.id !== active.id);
      return new Response(null, { status: 204 });
    }
    if (path === '/api/ranches' && request.method === 'POST') {
      const created = ranch(`r${this.ranches.length + 1}`, String(body?.name));
      this.ranches.push(created);
      this.ranchCreation = 'upsell';
      return Response.json(created, { status: 201 });
    }
    return Response.json({});
  };

  sent(method: string, path: string) {
    return this.calls.filter((c) => c.method === method && c.path === path);
  }

  first(method: string, path: string): Call {
    const [call] = this.sent(method, path);
    if (!call) throw new Error(`no ${method} ${path}`);
    return call;
  }
}

let fakeApi: FakeApi;
const user = userEvent.setup({ applyAccept: false });

beforeEach(() => {
  fakeApi = new FakeApi();
  vi.stubGlobal('fetch', vi.fn(fakeApi.handle));
  vi.stubGlobal('scrollTo', vi.fn());
  localStorage.clear();
  geocode.mockReset();
  geocode.mockResolvedValue(null);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderAt(path: string, { desktop = true, backend = new FakeBackend() } = {}) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: desktop, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] });
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <SnackbarProvider>
        <AuthProvider backend={backend}>
          <RouterProvider router={router} />
        </AuthProvider>
      </SnackbarProvider>
    </QueryClientProvider>,
  );
  return { router, backend };
}

// Required fields add " *" to the label, so match its start.
const labelled = (name: string) => new RegExp(`^${name.replace(/[()]/g, '\\$&')}`);
const field = (name: string) => screen.getByLabelText(labelled(name), { selector: 'input' });

describe('Mi cuenta', () => {
  it('saves profile edits and shows them in the header', async () => {
    renderAt('/config/perfil');
    expect(await screen.findByRole('link', { name: 'Mi cuenta' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(field('Nombre(s)')).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Editar' }));
    const save = screen.getByRole('button', { name: 'Guardar' });
    expect(save).toBeDisabled(); // Nothing changed yet.
    await user.clear(field('Nombre(s)'));
    await user.type(field('Nombre(s)'), 'Mariana');
    await user.type(field('Apellidos'), 'López');
    await user.click(save);

    await waitFor(() => expect(fakeApi.sent('PATCH', '/api/users/me')).toHaveLength(1));
    expect(fakeApi.first('PATCH', '/api/users/me').body).toEqual({
      first_name: 'Mariana',
      last_name: 'López',
      phone: '+523312345678',
    });
    const header = screen.getByRole('banner');
    expect(await within(header).findByText('Mariana')).toBeInTheDocument();
    expect(field('Nombre(s)')).toBeDisabled();
    expect(await screen.findByText('Tus datos se guardaron')).toBeInTheDocument();
  });

  it('requires a name and a full phone', async () => {
    renderAt('/config/perfil');
    await user.click(await screen.findByRole('button', { name: 'Editar' }));
    await user.clear(field('Nombre(s)'));
    await user.clear(field('Teléfono'));
    await user.type(field('Teléfono'), '33123');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByText('Es necesario tu nombre')).toBeInTheDocument();
    expect(screen.getByText('Al teléfono ingresado le faltan dígito(s)')).toBeInTheDocument();
    expect(fakeApi.sent('PATCH', '/api/users/me')).toHaveLength(0);
  });

  it('shows the email read-only', async () => {
    renderAt('/config/perfil');
    const email = await screen.findByDisplayValue('ana@example.com');
    await user.click(screen.getByRole('button', { name: 'Editar' }));
    expect(email).toBeDisabled();
  });

  it('refuses a photo over 2MB or not JPG/PNG with the design message', async () => {
    renderAt('/config/perfil');
    const input = await screen.findByLabelText('Foto de perfil');

    const big = new File(['x'], 'vaca.png', { type: 'image/png' });
    Object.defineProperty(big, 'size', { value: 2 * 1024 * 1024 + 1 });
    await user.upload(input, big);
    expect(await screen.findByText('El archivo supera el tamaño máximo de 2MB')).toBeVisible();

    await user.upload(input, new File(['GIF89a'], 'vaca.gif', { type: 'image/gif' }));
    expect(await screen.findByText('Sólo se permiten imágenes JPG o PNG')).toBeVisible();

    expect(fakeApi.sent('PUT', '/api/users/me/photo')).toHaveLength(0);
  });

  it('uploads a photo and shows it in the header avatar', async () => {
    renderAt('/config/perfil');
    const input = await screen.findByLabelText('Foto de perfil');

    await user.upload(input, new File(['png'], 'yo.png', { type: 'image/png' }));

    await waitFor(() => expect(fakeApi.sent('PUT', '/api/users/me/photo')).toHaveLength(1));
    expect(fakeApi.first('PUT', '/api/users/me/photo').contentType).toBe('image/png');
    const trigger = screen.getByRole('button', { name: 'Menú de cuenta' });
    await waitFor(() =>
      expect(trigger.querySelector('img')?.getAttribute('src')).toMatch(
        /\/api\/media\/avatars\/abc\.png$/,
      ),
    );
    expect(screen.getByRole('button', { name: 'Cambiar foto' })).toBeInTheDocument();
  });

  it('maps a refused upload to the design message', async () => {
    fakeApi.handle = async (request) =>
      new URL(request.url).pathname === '/api/users/me/photo'
        ? Response.json({ detail: 'photo_too_large' }, { status: 413 })
        : new FakeApi().handle(request);
    vi.stubGlobal('fetch', vi.fn(fakeApi.handle));
    renderAt('/config/perfil');

    await user.upload(
      await screen.findByLabelText('Foto de perfil'),
      new File(['png'], 'yo.png', { type: 'image/png' }),
    );

    expect(await screen.findByText('El archivo supera el tamaño máximo de 2MB')).toBeVisible();
  });

  it('changes the password only with the current one', async () => {
    const { backend } = renderAt('/config/perfil');
    await user.click(await screen.findByRole('button', { name: 'Cambiar contraseña' }));
    const dialog = await screen.findByRole('dialog');
    const save = within(dialog).getByRole('button', { name: 'Guardar' });
    const pw = (name: string) =>
      within(dialog).getByLabelText(labelled(name), { selector: 'input' });

    await user.type(pw('Contraseña actual'), 'equivocada');
    await user.type(pw('Nueva contraseña'), 'corta');
    expect(save).toBeDisabled();
    expect(await within(dialog).findByText('Usa al menos 8 caracteres')).toBeInTheDocument();

    await user.clear(pw('Nueva contraseña'));
    await user.type(pw('Nueva contraseña'), 'nuevaSegura1');
    await user.type(pw('Confirme su nueva contraseña'), 'otraCosa1');
    expect(await within(dialog).findByText('Las contraseñas no coinciden')).toBeInTheDocument();
    expect(save).toBeDisabled();

    await user.clear(pw('Confirme su nueva contraseña'));
    await user.type(pw('Confirme su nueva contraseña'), 'nuevaSegura1');
    await waitFor(() => expect(save).toBeEnabled());
    await user.click(save);
    expect(
      await within(dialog).findByText('La contraseña actual no es correcta'),
    ).toBeInTheDocument();

    await user.clear(pw('Contraseña actual'));
    await user.type(pw('Contraseña actual'), 'actual123');
    await user.click(save);

    expect(
      await screen.findByText('Felicidades!!! Ana acabas de actualizar tu contraseña'),
    ).toBeInTheDocument();
    expect(backend.changePassword).toHaveBeenLastCalledWith('actual123', 'nuevaSegura1');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it("doesn't offer a password change to a Google-only account", async () => {
    const backend = new FakeBackend();
    backend.password = false;
    renderAt('/config/perfil', { backend });

    expect(await screen.findByText(/Iniciaste sesión con Google o Apple/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cambiar contraseña' })).not.toBeInTheDocument();
  });

  it('works in the mobile layout too', async () => {
    renderAt('/config/perfil', { desktop: false });
    expect(await screen.findByRole('link', { name: 'Datos Rancho' })).toHaveAttribute(
      'href',
      '/config/ranchos',
    );
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
  });
});

describe('Datos Rancho', () => {
  it('saves the name, address and pin, and reloads them', async () => {
    renderAt('/config/ranchos');
    expect(await screen.findByText('Rancho: Mi rancho')).toBeInTheDocument();
    expect(screen.getByText('045')).toBeInTheDocument(); // Vacas en sistema.
    expect(await screen.findByText('no pin')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Editar' }));
    await user.clear(field('Nombre del rancho'));
    await user.type(field('Nombre del rancho'), 'El Bigotes');
    await user.type(field('Dirección'), 'Carretera a Tepa km 12');
    await user.click(await screen.findByRole('button', { name: 'drag pin' }));
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(fakeApi.sent('PATCH', '/api/ranch')).toHaveLength(1));
    expect(fakeApi.first('PATCH', '/api/ranch').body).toEqual({
      name: 'El Bigotes',
      address: 'Carretera a Tepa km 12',
      latitude: 20.812346,
      longitude: -102.765123,
    });
    expect(await screen.findByText('Rancho: El Bigotes')).toBeInTheDocument();
    // The switcher re-reads the account, so the new name shows there too.
    await waitFor(() => expect(fakeApi.sent('GET', '/api/auth/me').length).toBeGreaterThan(0));
    expect(
      screen.getByRole('button', { name: 'Cambiar de rancho: El Bigotes' }),
    ).toBeInTheDocument();
  });

  it('moves the pin to the address typed, and lets a hand move win', async () => {
    geocode.mockResolvedValue({
      pin: { latitude: 20.6866131, longitude: -103.4185478 },
      exact: true,
    });
    renderAt('/config/ranchos');
    await user.click(await screen.findByRole('button', { name: 'Editar' }));
    await user.type(field('Dirección'), 'Joseph Hyden 4942, Prados de Guadalupe');
    await user.tab(); // Leaving the field looks it up.

    expect(await screen.findByText('pin 20.686613,-103.418548')).toBeInTheDocument();
    expect(geocode).toHaveBeenCalledWith('Joseph Hyden 4942, Prados de Guadalupe');
    // Fine-tuning by hand keeps the hand-placed pin through the save.
    await user.click(screen.getByRole('button', { name: 'drag pin' }));
    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(fakeApi.sent('PATCH', '/api/ranch')).toHaveLength(1));
    expect(fakeApi.first('PATCH', '/api/ranch').body).toMatchObject({
      latitude: 20.812346,
      longitude: -102.765123,
    });
    expect(geocode).toHaveBeenCalledTimes(1);
  });

  it('looks the address up on Guardar when the field was never left', async () => {
    geocode.mockResolvedValue({ pin: { latitude: 20.1, longitude: -103.2 }, exact: false });
    renderAt('/config/ranchos');
    await user.click(await screen.findByRole('button', { name: 'Editar' }));
    await user.type(field('Dirección'), 'Tepatitlán');
    await user.keyboard('{Enter}');

    await waitFor(() => expect(fakeApi.sent('PATCH', '/api/ranch')).toHaveLength(1));
    expect(fakeApi.first('PATCH', '/api/ranch').body).toEqual({
      name: 'Mi rancho',
      address: 'Tepatitlán',
      latitude: 20.1,
      longitude: -103.2,
    });
  });

  it('waits for a lookup still running before saving', async () => {
    let answer: (found: { pin: Pin; exact: boolean }) => void = () => {};
    geocode.mockReturnValue(new Promise((resolve) => (answer = resolve)));
    renderAt('/config/ranchos');
    await user.click(await screen.findByRole('button', { name: 'Editar' }));
    await user.type(field('Dirección'), 'Carretera a Tepa km 12, Tepatitlán');
    await user.tab();
    expect(await screen.findByText('Buscando la dirección en el mapa…')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(fakeApi.sent('PATCH', '/api/ranch')).toHaveLength(0);

    answer({ pin: { latitude: 20.9, longitude: -102.8 }, exact: true });
    await waitFor(() => expect(fakeApi.sent('PATCH', '/api/ranch')).toHaveLength(1));
    expect(fakeApi.first('PATCH', '/api/ranch').body).toMatchObject({
      latitude: 20.9,
      longitude: -102.8,
    });
  });

  it('says when the lookup failed, and retries on the next blur', async () => {
    geocode.mockRejectedValueOnce(new Error('geocode 429'));
    geocode.mockResolvedValueOnce({ pin: { latitude: 20.5, longitude: -103.1 }, exact: true });
    renderAt('/config/ranchos');
    await user.click(await screen.findByRole('button', { name: 'Editar' }));
    await user.type(field('Dirección'), 'Hidalgo 4, Tepatitlán');
    await user.tab();
    expect(
      await screen.findByText(
        'No pudimos buscar la dirección en este momento. Toca el mapa donde está tu rancho.',
      ),
    ).toBeInTheDocument();

    await user.click(field('Dirección'));
    await user.tab();
    expect(await screen.findByText('pin 20.5,-103.1')).toBeInTheDocument();
  });

  it('asks for a nudge when only the area was found', async () => {
    geocode.mockResolvedValue({ pin: { latitude: 20.81, longitude: -102.76 }, exact: false });
    renderAt('/config/ranchos');
    await user.click(await screen.findByRole('button', { name: 'Editar' }));
    await user.type(field('Dirección'), 'Av. Juárez 120, Centro, Tepatitlán');
    await user.tab();

    expect(await screen.findByText('pin 20.81,-102.76')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Ubicamos la zona aproximada. Arrastra el pin al punto exacto de tu rancho.',
      ),
    ).toBeInTheDocument();
  });

  it('says so when the address is not on the map, and still saves', async () => {
    renderAt('/config/ranchos');
    await user.click(await screen.findByRole('button', { name: 'Editar' }));
    await user.type(field('Dirección'), 'Rancho sin calle');
    await user.tab();

    expect(
      await screen.findByText(
        'No encontramos esa dirección en el mapa. Toca el mapa donde está tu rancho.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('no pin')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(fakeApi.sent('PATCH', '/api/ranch')).toHaveLength(1));
    expect(fakeApi.first('PATCH', '/api/ranch').body).toEqual({
      name: 'Mi rancho',
      address: 'Rancho sin calle',
    });
    expect(geocode).toHaveBeenCalledTimes(1); // Guardar doesn't ask again for the same address.
  });

  it('reports a save as saved even when re-reading the account fails', async () => {
    const real = fakeApi.handle;
    let saved = false;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (request: Request) => {
        const path = new URL(request.url).pathname;
        if (path === '/api/ranch' && request.method === 'PATCH') saved = true;
        if (saved && path === '/api/auth/me') return new Response(null, { status: 503 });
        return real(request);
      }),
    );
    renderAt('/config/ranchos');
    await user.click(await screen.findByRole('button', { name: 'Editar' }));
    await user.type(field('Dirección'), 'Tepa');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByText('Los datos del rancho se guardaron')).toBeInTheDocument();
    expect(screen.queryByText('No pudimos guardar el rancho. Intenta de nuevo.')).toBeNull();
  });

  it('offers a retry when the ranch fails to load', async () => {
    const real = fakeApi.handle;
    let failures = 1;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (request: Request) => {
        if (new URL(request.url).pathname === '/api/ranch' && failures-- > 0) {
          return new Response(null, { status: 500 });
        }
        return real(request);
      }),
    );
    renderAt('/config/ranchos');

    expect(await screen.findByText('No pudimos cargar los datos del rancho.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Rancho: Mi rancho')).toBeInTheDocument();
  });

  it('opens with the saved pin', async () => {
    fakeApi.ranches = [
      ranch('r1', 'Mi rancho', { latitude: 20.5, longitude: -103.3, address: 'Tepa' }),
    ];
    renderAt('/config/ranchos');

    expect(await screen.findByText('pin 20.5,-103.3')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Tepa')).toBeDisabled();
  });

  it('requires a name and an address', async () => {
    renderAt('/config/ranchos');
    await user.click(await screen.findByRole('button', { name: 'Editar' }));
    await user.clear(field('Nombre del rancho'));
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByText('Escribe el nombre')).toBeInTheDocument();
    expect(screen.getByText('Escribe la dirección')).toBeInTheDocument();
    expect(fakeApi.sent('PATCH', '/api/ranch')).toHaveLength(0);
  });

  it('is read-only for a member who may not edit it', async () => {
    fakeApi.ranches = [
      ranch('r1', 'Rancho del jefe', { role: 'MEDICO', is_owner: false, can_edit: false }),
    ];
    renderAt('/config/ranchos');

    expect(
      await screen.findByText(
        'Sólo el Dueño o un Administrador pueden editar los datos del rancho.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Eliminar rancho' })).not.toBeInTheDocument();
  });

  it('deletes a ranch only after its name is typed', async () => {
    fakeApi.ranches = [ranch('r1', 'Mi rancho'), ranch('r2', 'El Bigotes')];
    localStorage.setItem('smartbell.activeRanch.u1', 'r2');
    renderAt('/config/ranchos');
    await user.click(await screen.findByRole('button', { name: 'Eliminar rancho' }));
    const dialog = await screen.findByRole('alertdialog');
    expect(within(dialog).getByText('¿Quieres borrar el rancho: El Bigotes?')).toBeInTheDocument();
    const confirm = within(dialog).getByRole('button', { name: 'Borrar rancho' });
    expect(confirm).toBeDisabled();

    await user.type(within(dialog).getByLabelText(/Escribe el nombre del rancho/), 'el bigotes');
    await user.click(confirm);

    await waitFor(() => expect(fakeApi.sent('DELETE', '/api/ranch')).toHaveLength(1));
    const call = fakeApi.first('DELETE', '/api/ranch');
    expect(call.ranchHeader).toBe('r2');
    expect(call.body).toEqual({ confirm_name: 'el bigotes' });
    expect(await screen.findByText('Rancho: Mi rancho')).toBeInTheDocument();
  });

  it("doesn't offer to delete the only ranch", async () => {
    renderAt('/config/ranchos');

    expect(await screen.findByRole('button', { name: 'Eliminar rancho' })).toBeDisabled();
    expect(screen.getByText('No puedes borrar tu único rancho.')).toBeInTheDocument();
  });

  it('shows the Pro upsell to a free owner adding a second ranch', async () => {
    renderAt('/config/ranchos');
    await user.click(await screen.findByRole('button', { name: 'Agregar rancho' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Agrega más ranchos con Pro')).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: 'Ver planes' })).toHaveAttribute(
      'href',
      expect.stringContaining('wa.me'),
    );
    expect(fakeApi.sent('POST', '/api/ranches')).toHaveLength(0);
  });

  it('creates a ranch when allowed and switches to it', async () => {
    fakeApi.ranchCreation = 'allowed';
    renderAt('/config/ranchos');
    await user.click(await screen.findByRole('button', { name: 'Agregar rancho' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(/Nombre del rancho/), 'La Trajinera');
    await user.click(within(dialog).getByRole('button', { name: 'Registrar rancho' }));

    expect(await screen.findByText('Rancho: La Trajinera')).toBeInTheDocument();
    expect(fakeApi.first('POST', '/api/ranches').body).toEqual({ name: 'La Trajinera' });
    expect(screen.getByText(/se registró con Éxito/)).toBeInTheDocument();
    // Every ranch-scoped call after the switch names the new ranch.
    const after = fakeApi.calls.slice(fakeApi.calls.findIndex((c) => c.path === '/api/ranches'));
    const ranchCalls = after.filter((c) => c.path === '/api/ranch');
    expect(ranchCalls.length).toBeGreaterThan(0);
    expect(ranchCalls.every((c) => c.ranchHeader === 'r2')).toBe(true);
  });
});
