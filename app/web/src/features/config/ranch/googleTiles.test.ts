import { afterEach, describe, expect, it, vi } from 'vitest';

import { createTileSession } from './googleTiles';

afterEach(() => vi.unstubAllGlobals());

describe('createTileSession', () => {
  it('opens a roadmap session for Mexico and builds Google tile URLs', async () => {
    const fetch = vi.fn(async (url: string, init?: RequestInit) =>
      url.includes('/viewport')
        ? Response.json({ copyright: 'Google, INEGI' })
        : Response.json({ session: 'S1', expiry: '1' }, { status: init ? 200 : 500 }),
    );
    vi.stubGlobal('fetch', fetch);

    const session = await createTileSession('browser-key');

    const [createUrl, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(createUrl).toBe('https://tile.googleapis.com/v1/createSession?key=browser-key');
    expect(JSON.parse(String(init.body))).toEqual({
      mapType: 'roadmap',
      language: 'es-MX',
      region: 'MX',
    });
    expect(session.url).toBe(
      'https://tile.googleapis.com/v1/2dtiles/{z}/{x}/{y}?session=S1&key=browser-key',
    );
    expect(session.url).not.toContain('openstreetmap');
    const text = await session.copyright({
      zoom: 14,
      north: 21,
      south: 20,
      east: -102,
      west: -103,
    });
    expect(text).toMatch(/^Map data ©\d{4} Google, INEGI$/);
  });

  it('fails when Google refuses the key', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('denied', { status: 403 })),
    );

    await expect(createTileSession('bad')).rejects.toThrow('tile session 403');
  });
});
