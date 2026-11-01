import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { SnackbarProvider } from '../ui/SnackbarProvider';
import { shellRoute } from './routes';
import { whatsappUrl } from './whatsapp';

function renderShell({ desktop, path = '/' }: { desktop: boolean; path?: string }) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: desktop,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => Response.json({ status: 'ok' })),
  );
  const router = createMemoryRouter([shellRoute], { initialEntries: [path] });
  render(
    <QueryClientProvider client={new QueryClient()}>
      <SnackbarProvider>
        <RouterProvider router={router} />
      </SnackbarProvider>
    </QueryClientProvider>,
  );
  return router;
}

const prefilled = (href: string | null) => new URL(href ?? '').searchParams.get('text');

describe('AppShell', () => {
  it('shows the five mobile tabs, with Tareas first and no Alertas or Historial', () => {
    renderShell({ desktop: false });
    const nav = screen.getByRole('navigation');
    const names = [...nav.querySelectorAll('a, button')].map((el) => el.textContent);
    expect(names).toEqual(['Tareas', 'Vacas', 'Grupos', 'Reportes', 'Ranchos']);
  });

  it('shows the six web items', () => {
    renderShell({ desktop: true });
    const nav = screen.getByRole('navigation');
    const names = [...nav.querySelectorAll('a, button')].map((el) => el.textContent);
    expect(names).toEqual(['Tareas', 'Vacas', 'Grupos', 'Reportes', 'Usuarios', 'Ranchos']);
  });

  it('goes to built tabs and marks the active one', async () => {
    const router = renderShell({ desktop: false });
    await userEvent.click(screen.getByRole('link', { name: 'Vacas' }));
    expect(router.state.location.pathname).toBe('/vacas');
    expect(screen.getByRole('link', { name: 'Vacas' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Tareas' })).not.toHaveAttribute('aria-current');
  });

  it.each([
    [false, 'Grupos'],
    [false, 'Reportes'],
    [false, 'Ranchos'],
    [true, 'Usuarios'],
  ])('fake door (desktop %s): %s opens the modal and stays put', async (desktop, tab) => {
    const router = renderShell({ desktop });
    await userEvent.click(screen.getByRole('button', { name: tab }));
    const dialog = await screen.findByRole('dialog', { name: 'Funcionalidad en construcción' });
    const link = within(dialog).getByRole('link', { name: 'Contactar en WhatsApp' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(prefilled(link.getAttribute('href'))).toBe(
      `Me interesa la funcionalidad ${tab}, quisiera conocer más acerca de la misma`,
    );
    expect(router.state.location.pathname).toBe('/');
  });

  it('avatar menu has the §1.13 items and Soporte opens WhatsApp prefilled', async () => {
    renderShell({ desktop: false });
    await userEvent.click(screen.getByRole('button', { name: /Menú de cuenta/ }));
    const items = await screen.findAllByRole('menuitem');
    expect(items.map((el) => el.textContent)).toEqual([
      'Mi perfil',
      'Mis ranchos',
      'Mensajes recibidos',
      'Administrar usuarios',
      'Soporte',
      'Cerrar sesión',
    ]);
    const soporte = screen.getByRole('menuitem', { name: 'Soporte' });
    expect(new URL(soporte.getAttribute('href') ?? '').host).toBe('wa.me');
    expect(prefilled(soporte.getAttribute('href'))).toBe(
      'Necesito que me ayuden a usar Smartbell.',
    );
  });

  it('avatar items route to their config placeholder', async () => {
    const router = renderShell({ desktop: true });
    await userEvent.click(screen.getByRole('button', { name: /Menú de cuenta/ }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Mi perfil' }));
    expect(router.state.location.pathname).toBe('/config/perfil');
    expect(await screen.findByRole('heading', { name: 'Mi perfil' })).toBeInTheDocument();
  });

  it('switches ranch from the stub context', async () => {
    renderShell({ desktop: false });
    await userEvent.click(screen.getByRole('button', { name: /Rancho San José/ }));
    await userEvent.click(await screen.findByRole('menuitemradio', { name: 'Rancho El Mezquite' }));
    expect(screen.getByRole('button', { name: /Rancho El Mezquite/ })).toBeInTheDocument();
  });

  it('reads the bell count from the context', () => {
    renderShell({ desktop: true });
    expect(screen.getByRole('link', { name: 'Notificaciones: 4' })).toHaveAttribute(
      'href',
      '/config/mensajes',
    );
  });

  it('holds deep links to unbuilt features on a placeholder page', () => {
    renderShell({ desktop: true, path: '/grupos' });
    expect(screen.getByRole('heading', { name: 'Grupos' })).toBeInTheDocument();
  });
});

describe('whatsappUrl', () => {
  it('encodes the message', () => {
    expect(whatsappUrl('¿Hola & adiós?')).toBe(
      'https://wa.me/523334056398?text=%C2%BFHola%20%26%20adi%C3%B3s%3F',
    );
  });
});
