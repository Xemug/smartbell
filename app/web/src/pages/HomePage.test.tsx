import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { HomePage } from './HomePage';

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <HomePage />
    </QueryClientProvider>,
  );
}

describe('HomePage', () => {
  it('renders the status returned by /api/health', async () => {
    const fetchMock = vi.fn(async () => Response.json({ status: 'ok' }));
    vi.stubGlobal('fetch', fetchMock);

    renderPage();

    expect(await screen.findByText('ok')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Smartbell' })).toBeInTheDocument();
    const [request] = fetchMock.mock.calls[0] as unknown as [Request];
    expect(new URL(request.url).pathname).toBe('/api/health');
  });

  it('shows the es-MX error copy when the api is unreachable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 503 })),
    );

    renderPage();

    expect(await screen.findByText('Sin conexión con la API')).toBeInTheDocument();
  });
});
