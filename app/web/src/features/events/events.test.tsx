import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import {
  Link,
  MemoryRouter,
  Route,
  RouterProvider,
  Routes,
  createMemoryRouter,
} from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SnackbarProvider } from '../../ui/SnackbarProvider';
import { detail } from '../animals/profile/testData';
import type { AnimalDetail } from '../animals/profile/api';
import { EventLauncherProvider } from './EventLauncher';
import { launcherEntries, launcherGroups, windowReason } from './eventTypes';
import { EventWizard } from './EventWizard';
import type { EventFlow, EventFlowProps } from './flows';
import { useEventLauncher } from './launcherContext';

const TODAY = new Date(2026, 10, 26, 9);
let cow: AnimalDetail;
let posts: unknown[];
/** When set, the POST waits for it. */
let holdPost: Promise<void> | null;

function providers(children: React.ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={queryClient}>
      <SnackbarProvider>{children}</SnackbarProvider>
    </QueryClientProvider>
  );
}

/** A flow with one text box: typing in it is "data entered". */
function StubForm({ setDirty, record, cancel }: EventFlowProps) {
  const [weight, setWeight] = useState('');
  return (
    <div>
      <label>
        Peso
        <input
          value={weight}
          onChange={(e) => {
            setWeight(e.target.value);
            setDirty(e.target.value !== '');
          }}
        />
      </label>
      <button type="button" onClick={cancel}>
        Regresar
      </button>
      <button
        type="button"
        onClick={() =>
          record({ occurred_on: '2026-11-26', payload: { type: 'WEIGHT', kg: Number(weight) } })
        }
      >
        Guardar
      </button>
    </div>
  );
}
const stub: EventFlow = { titleKey: 'events.titles.HEAT', Component: StubForm };

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ['Date'] });
  vi.setSystemTime(TODAY);
  posts = [];
  holdPost = null;
  cow = detail({
    id: 'a-1',
    projection: { next_heat: { start: '2026-11-24', end: '2026-11-30' } },
  });
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
  vi.stubGlobal(
    'fetch',
    vi.fn(async (request: Request) => {
      const url = new URL(request.url);
      if (request.method === 'GET' && url.pathname === '/api/animals/a-1')
        return Response.json(cow);
      if (request.method === 'POST' && url.pathname === '/api/animals/a-1/events') {
        posts.push(JSON.parse(await request.text()));
        if (holdPost) await holdPost;
        return Response.json({ animal: cow, open_alerts: [] }, { status: 201 });
      }
      return Response.json({ detail: 'not_mocked' }, { status: 404 });
    }),
  );
});

afterEach(() => {
  vi.useRealTimers();
});

describe('the launcher model', () => {
  it('enables a reproduction entry only inside its window', () => {
    expect(windowReason(cow.projection, 'HEAT', TODAY)).toBeNull();
    expect(windowReason(cow.projection, 'HEAT', new Date(2026, 10, 30, 23))).toBeNull();
    expect(windowReason(cow.projection, 'HEAT', new Date(2026, 10, 23))).toEqual({
      key: 'opensOn',
      params: { date: '24 nov' },
    });
    expect(windowReason(cow.projection, 'HEAT', new Date(2026, 11, 1))).toEqual({
      key: 'closedOn',
      params: { date: '30 nov' },
    });
    expect(windowReason(cow.projection, 'CALVING', TODAY)).toEqual({ key: 'noWindow' });
    // Health entries have no window.
    expect(windowReason(cow.projection, 'ILLNESS', TODAY)).toBeNull();
  });

  it('marks entries without a flow as coming, after the window reason', () => {
    const entries = launcherEntries(cow, 'reproduccion', TODAY, (kind) => kind === 'HEAT');
    expect(entries).toEqual([
      { kind: 'HEAT', reason: null },
      { kind: 'PREGNANCY_CHECK', reason: { key: 'noWindow' } },
      { kind: 'CALVING', reason: { key: 'noWindow' } },
      { kind: 'ABORTION', reason: { key: 'soon' } },
    ]);
  });

  it('offers a bull the health entries only', () => {
    expect(launcherGroups(cow)).toEqual(['reproduccion', 'salud']);
    expect(launcherGroups(detail({ sex: 'MACHO', kind: 'TORO' }))).toEqual(['salud']);
  });
});

describe('EventWizard', () => {
  it('closes at once when nothing was entered', async () => {
    const onClose = vi.fn();
    render(
      providers(
        <MemoryRouter>
          <EventWizard animalId="a-1" kind="HEAT" flow={stub} onClose={onClose} />
        </MemoryRouter>,
      ),
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Regresar' }));
    expect(onClose).toHaveBeenCalledWith(false);
  });

  it('asks before backing out with data entered', async () => {
    const onClose = vi.fn();
    render(
      providers(
        <MemoryRouter>
          <EventWizard animalId="a-1" kind="HEAT" flow={stub} onClose={onClose} />
        </MemoryRouter>,
      ),
    );
    await userEvent.type(await screen.findByLabelText('Peso'), '480');
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(
      await screen.findByRole('alertdialog', { name: '¿Descartar los cambios?' }),
    ).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Seguir editando' }));
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Peso')).toHaveValue('480');

    await userEvent.click(screen.getByRole('button', { name: 'Regresar' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Sí, descartar' }));
    expect(onClose).toHaveBeenCalledWith(false);
  });

  it('asks before leaving the page with data entered', async () => {
    const onClose = vi.fn();
    const router = createMemoryRouter(
      [
        {
          path: '/vacas/a-1',
          element: (
            <>
              <Link to="/grupos">Grupos</Link>
              <EventWizard animalId="a-1" kind="HEAT" flow={stub} onClose={onClose} />
            </>
          ),
        },
        { path: '/grupos', element: <p>grupos</p> },
      ],
      { initialEntries: ['/vacas/a-1'] },
    );
    render(providers(<RouterProvider router={router} />));
    await userEvent.type(await screen.findByLabelText('Peso'), '480');
    // The modal hides the page from pointer and keyboard; a back gesture is a navigation.
    await router.navigate('/grupos');
    expect(
      await screen.findByRole('alertdialog', { name: '¿Descartar los cambios?' }),
    ).toBeVisible();
    expect(router.state.location.pathname).toBe('/vacas/a-1');
    await userEvent.click(screen.getByRole('button', { name: 'Sí, descartar' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/grupos'));
    expect(onClose).toHaveBeenCalledWith(false);
  });
});

/** Stands in for tasks-home's automatic heat task until that screen exists. */
function FakeHeatTask() {
  const { openEvent } = useEventLauncher();
  const [status, setStatus] = useState('abierta');
  return (
    <div>
      <p>Tarea {status}</p>
      <button
        type="button"
        onClick={() =>
          void openEvent('a-1', 'HEAT', 'task-1').then((recorded) =>
            setStatus(recorded ? 'cerrada' : 'abierta'),
          )
        }
      >
        Observar el celo de vaca 00001
      </button>
    </div>
  );
}

describe('openEvent', () => {
  const renderTask = () =>
    render(
      providers(
        <MemoryRouter>
          <EventLauncherProvider>
            <FakeHeatTask />
          </EventLauncherProvider>
        </MemoryRouter>,
      ),
    );

  it('lets a task open the heat prompt and close itself once it is recorded', async () => {
    renderTask();
    await userEvent.click(screen.getByRole('button', { name: 'Observar el celo de vaca 00001' }));
    expect(await screen.findByRole('dialog', { name: 'Registro de celo' })).toBeVisible();
    await userEvent.click(await screen.findByRole('button', { name: 'No entró' }));

    expect(await screen.findByText('Tarea cerrada')).toBeInTheDocument();
    // No profile behind a task, so the snackbar names the cow.
    expect(screen.getByText('Vaca 00001: celo registrado')).toBeInTheDocument();
    expect(posts).toEqual([
      { occurred_on: '2026-11-26', payload: { type: 'HEAT', outcome: 'NOT_OBSERVED' } },
    ]);
  });

  it('leaves the task open when the user backs out', async () => {
    renderTask();
    await userEvent.click(screen.getByRole('button', { name: 'Observar el celo de vaca 00001' }));
    await screen.findByRole('button', { name: 'No entró' });
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Registro de celo' })).not.toBeInTheDocument(),
    );
    expect(screen.getByText('Tarea abierta')).toBeInTheDocument();
    expect(posts).toEqual([]);
  });

  it('saves once on a double tap', async () => {
    renderTask();
    await userEvent.click(screen.getByRole('button', { name: 'Observar el celo de vaca 00001' }));
    await userEvent.dblClick(await screen.findByRole('button', { name: 'No entró' }));
    expect(await screen.findByText('Tarea cerrada')).toBeInTheDocument();
    expect(posts).toHaveLength(1);
  });

  it('still closes the task when the page changes mid-save', async () => {
    let release = () => {};
    holdPost = new Promise((resolve) => {
      release = resolve;
    });
    render(
      providers(
        <MemoryRouter initialEntries={['/tareas']}>
          <EventLauncherProvider>
            <FakeHeatTask />
            <Link to="/vacas">Vacas</Link>
            <Routes>
              <Route path="/tareas" element={<p>tareas</p>} />
              <Route path="/vacas" element={<p>vacas</p>} />
            </Routes>
          </EventLauncherProvider>
        </MemoryRouter>,
      ),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Observar el celo de vaca 00001' }));
    await userEvent.click(await screen.findByRole('button', { name: 'No entró' }));
    await waitFor(() => expect(posts).toHaveLength(1));
    // A back gesture while the POST is in flight: the form goes, the save does not.
    await userEvent.click(screen.getByRole('link', { name: 'Vacas', hidden: true }), {
      pointerEventsCheck: 0,
    });
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Registro de celo' })).not.toBeInTheDocument(),
    );
    expect(screen.getByText('Tarea abierta')).toBeInTheDocument();
    release();
    expect(await screen.findByText('Tarea cerrada')).toBeInTheDocument();
  });
});
