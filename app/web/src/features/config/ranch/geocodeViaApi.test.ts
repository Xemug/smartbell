import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { addressAt, geocodeAddress, timing } from './geocode';

// Hosted builds: lookups go through our API (Google behind it), never to OpenStreetMap.
beforeEach(() => {
  timing.gapMs = 0;
  vi.stubEnv('VITE_GEOCODE_VIA_API', 'true');
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const urlOf = (fetch: ReturnType<typeof vi.fn>, call = 0) =>
  new URL(((fetch.mock.calls[call] as unknown[])[0] as Request).url);

describe('geocoding through the API', () => {
  it('searches with /api/geocode/search and never calls Nominatim', async () => {
    const fetch = vi.fn(async () => Response.json({ pin: { latitude: 20.6, longitude: -103.4 } }));
    vi.stubGlobal('fetch', fetch);

    expect(await geocodeAddress('Calle Hidalgo 12, Arandas, Jalisco')).toEqual({
      pin: { latitude: 20.6, longitude: -103.4 },
      exact: true,
    });
    const url = urlOf(fetch);
    expect(url.pathname).toBe('/api/geocode/search');
    expect(url.searchParams.get('q')).toBe('Calle Hidalgo 12, Arandas, Jalisco');
    expect(url.host).not.toContain('openstreetmap');
  });

  it('falls back to broader searches when the API finds nothing', async () => {
    const fetch = vi.fn(async (request: Request) =>
      Response.json({
        pin:
          new URL(request.url).searchParams.get('q') === 'Arandas, Jalisco'
            ? { latitude: 20.7, longitude: -102.3 }
            : null,
      }),
    );
    vi.stubGlobal('fetch', fetch);

    expect(await geocodeAddress('Calle Sin Nombre, Arandas, Jalisco')).toEqual({
      pin: { latitude: 20.7, longitude: -102.3 },
      exact: false,
    });
  });

  it('reads the street address at a pin from /api/geocode/reverse', async () => {
    const fetch = vi.fn(async () => Response.json({ address: 'Av. Juárez 12, Arandas, Jalisco' }));
    vi.stubGlobal('fetch', fetch);

    expect(await addressAt({ latitude: 20.71, longitude: -102.35 })).toBe(
      'Av. Juárez 12, Arandas, Jalisco',
    );
    const url = urlOf(fetch);
    expect(url.pathname).toBe('/api/geocode/reverse');
    expect(url.searchParams.get('latitude')).toBe('20.71');
  });

  it('turns an API error into a failed lookup', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ detail: 'x' }, { status: 502 })),
    );

    await expect(addressAt({ latitude: 1, longitude: 2 })).rejects.toThrow('geocode');
  });
});
