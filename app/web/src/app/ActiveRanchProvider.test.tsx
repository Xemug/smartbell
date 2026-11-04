import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { api } from '../api/client';
import { AuthContext, type AuthApi } from '../features/auth/useAuth';
import { ActiveRanchProvider } from './ActiveRanchProvider';
import { RanchSwitcher } from './RanchSwitcher';
import { activeRanchKey, useActiveRanch } from './useActiveRanch';

const ranchA = { id: 'ranch-a', name: 'Rancho A', role: 'DUENO' as const, permissions: [] };
const ranchB = {
  id: 'ranch-b',
  name: 'Rancho B',
  role: 'TECNICO_CAMPO' as const,
  permissions: ['ANIMALS_VIEW' as const],
};

function authFor(ranches = [ranchA, ranchB]): AuthApi {
  const user = {
    id: 'user-1',
    first_name: 'Ana',
    last_name: null,
    email: 'ana@example.com',
    phone: null,
    photo_url: null,
  };
  const noop = vi.fn(async () => {});
  return {
    state: { status: 'signedIn', account: { user, ranches }, created: false },
    signIn: noop,
    signUp: noop,
    signInWith: noop,
    resetPassword: noop,
    signOut: noop,
    retry: vi.fn(),
  };
}

/** Two unrelated queries: switching must refetch both, each with the new ranch. */
function Probe() {
  const { can } = useActiveRanch();
  const members = useQuery({
    queryKey: ['members'],
    queryFn: async () => (await api.GET('/api/ranch/members')).data,
  });
  const ranches = useQuery({
    queryKey: ['ranches'],
    queryFn: async () => (await api.GET('/api/ranches')).data,
  });
  return (
    <p>
      {members.data && ranches.data ? 'loaded' : 'loading'}
      {can('ANIMALS_VIEW') ? ' can-view' : ''}
    </p>
  );
}

let calls: { path: string; ranch: string | null }[];

function renderWith(auth = authFor()) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={auth}>
        <ActiveRanchProvider>
          <RanchSwitcher />
          <Probe />
        </ActiveRanchProvider>
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
}

const switcher = () => screen.getByRole('button', { name: /Rancho/ });

beforeEach(() => {
  calls = [];
  localStorage.clear();
  vi.stubGlobal(
    'fetch',
    vi.fn(async (request: Request) => {
      calls.push({
        path: new URL(request.url).pathname,
        ranch: request.headers.get('X-Ranch-Id'),
      });
      return Response.json([]);
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('ActiveRanchProvider', () => {
  it('starts on the first ranch and sends it with every call', async () => {
    renderWith();
    expect(await screen.findByText('loaded')).toBeInTheDocument();
    expect(switcher()).toHaveTextContent('Rancho A');
    expect(calls.map((call) => call.ranch)).toEqual(['ranch-a', 'ranch-a']);
  });

  it('lists the user ranches and, on a switch, refetches every query with the new ranch', async () => {
    renderWith();
    await screen.findByText('loaded');
    calls = [];

    await userEvent.click(switcher());
    const options = await screen.findAllByRole('menuitemradio');
    expect(options.map((option) => option.textContent)).toEqual(['Rancho A', 'Rancho B']);
    await userEvent.click(screen.getByRole('menuitemradio', { name: 'Rancho B' }));

    await waitFor(() => expect(calls).toHaveLength(2));
    expect(new Set(calls.map((call) => call.path))).toEqual(
      new Set(['/api/ranch/members', '/api/ranches']),
    );
    expect(calls.every((call) => call.ranch === 'ranch-b')).toBe(true);
    expect(switcher()).toHaveTextContent('Rancho B');
    expect(localStorage.getItem(activeRanchKey('user-1'))).toBe('ranch-b');
  });

  it('shows no data from the old ranch while the new one loads', async () => {
    renderWith();
    await screen.findByText('loaded');
    let release = () => {};
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            release = () => resolve(Response.json([]));
          }),
      ),
    );

    await userEvent.click(switcher());
    await userEvent.click(await screen.findByRole('menuitemradio', { name: 'Rancho B' }));

    expect(await screen.findByText(/loading/)).toBeInTheDocument();
    release();
  });

  it('reopens on the ranch chosen last time', async () => {
    localStorage.setItem(activeRanchKey('user-1'), 'ranch-b');
    renderWith();
    expect(await screen.findByText(/loaded/)).toBeInTheDocument();
    expect(switcher()).toHaveTextContent('Rancho B');
    expect(calls.every((call) => call.ranch === 'ranch-b')).toBe(true);
  });

  it('falls back to the first ranch when the stored one is gone', async () => {
    localStorage.setItem(activeRanchKey('user-1'), 'ranch-removed');
    renderWith();
    await screen.findByText('loaded');
    expect(switcher()).toHaveTextContent('Rancho A');
    expect(calls.every((call) => call.ranch === 'ranch-a')).toBe(true);
  });

  it('stops sending the ranch once the shell unmounts (sign-out)', async () => {
    const { unmount } = renderWith();
    await screen.findByText('loaded');
    unmount();
    calls = [];

    await api.GET('/api/ranches');

    expect(calls).toEqual([{ path: '/api/ranches', ranch: null }]);
  });

  it('answers can() from the active ranch permissions', async () => {
    localStorage.setItem(activeRanchKey('user-1'), 'ranch-b');
    renderWith();
    expect(await screen.findByText('loaded can-view')).toBeInTheDocument();
  });
});
