import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  addressAt,
  cleanAddress,
  formatCoordinates,
  geocodeAddress,
  parseCoordinates,
  searchesFor,
  timing,
} from './geocode';

beforeEach(() => {
  timing.gapMs = 0;
});
afterEach(() => vi.unstubAllGlobals());

const asked = (fetch: ReturnType<typeof vi.fn>) =>
  fetch.mock.calls.map((call) => new URL(String((call as unknown[])[0])).searchParams.get('q'));

describe('cleanAddress', () => {
  it.each([
    ['Joseph Hyden 4942, col. Prados de Guadalupe', 'Joseph Hyden 4942, Prados de Guadalupe'],
    ['Av. Juárez #120, Colonia Centro, C.P. 47600', 'Av. Juárez 120, Centro, 47600'],
    ['Calle Hidalgo No. 5, Fracc. Las Lomas', 'Calle Hidalgo 5, Las Lomas'],
    ['  Carretera a Tepa  km 12 ,, Jalisco ', 'Carretera a Tepa km 12, Jalisco'],
    ['Colosio 3, Nogales', 'Colosio 3, Nogales'],
    ['Calle No Reelección 8', 'Calle No Reelección 8'],
  ])('%s', (typed, sent) => expect(cleanAddress(typed)).toBe(sent));
});

describe('searchesFor', () => {
  it('broadens step by step but never to a lone place name', () => {
    expect(searchesFor('Av. Juárez #120, Colonia Centro, Tepatitlán, Jalisco')).toEqual([
      'Av. Juárez 120, Centro, Tepatitlán, Jalisco',
      'Av. Juárez, Centro, Tepatitlán, Jalisco',
      'Centro, Tepatitlán, Jalisco',
      'Tepatitlán, Jalisco',
    ]);
    expect(searchesFor('Joseph Hyden 4942, col. Prados de Guadalupe')).toEqual([
      'Joseph Hyden 4942, Prados de Guadalupe',
      'Joseph Hyden, Prados de Guadalupe',
    ]);
    expect(searchesFor('Prados de Guadalupe')).toEqual(['Prados de Guadalupe']);
    expect(searchesFor('  ,  ')).toEqual([]);
  });
});

describe('geocodeAddress', () => {
  it('asks OSM worldwide, Mexico first, and reads the first hit as exact', async () => {
    const fetch = vi.fn(async () => Response.json([{ lat: '20.6866131', lon: '-103.4185478' }]));
    vi.stubGlobal('fetch', fetch);

    expect(await geocodeAddress('  Joseph Haydn   4942, Zapopan ')).toEqual({
      pin: { latitude: 20.6866131, longitude: -103.4185478 },
      exact: true,
    });
    const url = new URL(String((fetch.mock.calls[0] as unknown[])[0]));
    expect(url.origin + url.pathname).toBe('https://nominatim.openstreetmap.org/search');
    expect(url.searchParams.get('countrycodes')).toBeNull(); // A ranch in the US is found too.
    expect(url.searchParams.get('viewbox')).toBe('-118.6,32.8,-86.5,14.4');
    expect(url.searchParams.get('bounded')).toBe('0');
    expect(url.searchParams.get('limit')).toBe('1');

    await geocodeAddress('joseph haydn 4942, zapopan');
    expect(fetch).toHaveBeenCalledTimes(1); // Cached: the usage policy asks for no repeats.
  });

  it('falls back to the area, and marks it approximate', async () => {
    const fetch = vi.fn(async (url: string) =>
      Response.json(
        new URL(url).searchParams.get('q') === 'Centro, Tepatitlán'
          ? [{ lat: '20.8', lon: '-102.7' }]
          : [],
      ),
    );
    vi.stubGlobal('fetch', fetch);

    expect(await geocodeAddress('Hidalgo 4, Centro, Tepatitlán')).toEqual({
      pin: { latitude: 20.8, longitude: -102.7 },
      exact: false,
    });
    expect(asked(fetch)).toEqual([
      'Hidalgo 4, Centro, Tepatitlán',
      'Hidalgo, Centro, Tepatitlán',
      'Centro, Tepatitlán',
    ]);
  });

  it('spaces requests a second apart', async () => {
    vi.useFakeTimers();
    timing.gapMs = 1100;
    const fetch = vi.fn(async () => Response.json([]));
    vi.stubGlobal('fetch', fetch);
    const pending = geocodeAddress('Uno 1, Dos, Tres');
    await vi.advanceTimersByTimeAsync(0);
    const first = fetch.mock.calls.length;
    await vi.advanceTimersByTimeAsync(1100);
    expect(fetch.mock.calls.length).toBe(first + 1);
    await vi.runAllTimersAsync();
    expect(await pending).toBeNull();
    vi.useRealTimers();
  });

  it('returns null for no match and throws on a failed request', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json([])),
    );
    expect(await geocodeAddress('Nowhere at all')).toBeNull();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 429 })),
    );
    await expect(geocodeAddress('Too fast')).rejects.toThrow('geocode 429');
    expect(await geocodeAddress('   ')).toBeNull();
  });
});

describe('coordinates as an address', () => {
  it('reads typed coordinates and writes them back the same way', () => {
    expect(parseCoordinates('20.95, -102.6')).toEqual({ latitude: 20.95, longitude: -102.6 });
    expect(parseCoordinates(' 20.950000 -102.600000 ')).toEqual({
      latitude: 20.95,
      longitude: -102.6,
    });
    expect(parseCoordinates('95, 10')).toBeNull(); // No latitude past the pole.
    expect(parseCoordinates('Calle 5, 120')).toBeNull();
    expect(formatCoordinates({ latitude: 20.95, longitude: -102.6 })).toBe(
      '20.950000, -102.600000',
    );
  });

  it('places typed coordinates without asking OSM', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    expect(await geocodeAddress('20.95, -102.6')).toEqual({
      pin: { latitude: 20.95, longitude: -102.6 },
      exact: true,
    });
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('addressAt', () => {
  const reverse = (address: Record<string, string>) =>
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ address })),
    );

  it('names the street, colonia, town and state', async () => {
    reverse({
      road: 'Calle Joseph Haydn',
      house_number: '4942',
      suburb: 'Prados Guadalupe',
      city: 'Zapopan',
      state: 'Jalisco',
      country: 'México',
      country_code: 'mx',
    });
    expect(await addressAt({ latitude: 20.68, longitude: -103.41 })).toBe(
      'Calle Joseph Haydn 4942, Prados Guadalupe, Zapopan, Jalisco',
    );
  });

  it('adds the country outside Mexico', async () => {
    reverse({
      road: 'Woodridge Way',
      house_number: '3919',
      town: 'Tucker',
      state: 'Georgia',
      country: 'Estados Unidos',
      country_code: 'us',
    });
    expect(await addressAt({ latitude: 33.85, longitude: -84.21 })).toBe(
      'Woodridge Way 3919, Tucker, Georgia, Estados Unidos',
    );
  });

  it('returns null where there is no street, and asks at street level', async () => {
    const fetch = vi.fn(async () => Response.json({ address: { state: 'Jalisco' } }));
    vi.stubGlobal('fetch', fetch);
    expect(await addressAt({ latitude: 20.95, longitude: -102.6 })).toBeNull();
    const url = new URL(String((fetch.mock.calls[0] as unknown[])[0]));
    expect(url.pathname).toBe('/reverse');
    expect(url.searchParams.get('zoom')).toBe('17');
  });
});
