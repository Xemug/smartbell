import type { Pin } from './pin';

// OpenStreetMap's free geocoder, the same data as the map tiles. Its usage policy allows one
// request a second and no search-as-you-type, so callers look up a finished address (on blur or
// on save), never per keystroke, and requests here are spaced out; the browser's Referer
// identifies the app.
const NOMINATIM = 'https://nominatim.openstreetmap.org/search';

/** Mexico's bounding box (west, north, east, south), used as a preference, not a limit. */
const MEXICO = '-118.6,32.8,-86.5,14.4';

/** Spacing between requests. Tests set it to 0. */
export const timing = { gapMs: 1100 };
let lastRequest = 0;

export interface Located {
  pin: Pin;
  /** False when only a broader area (the colonia or town) was found: the pin needs a nudge. */
  exact: boolean;
}

const cache = new Map<string, Pin | null>();

// Labels people write in Mexican addresses that OSM doesn't index: "col. Prados" finds nothing
// where "Prados" finds the street.
const LABELS =
  /(^|[\s,])(col(onia)?|fracc(ionamiento)?|c\.?\s?p|n[úu]m(ero)?|no(?=\.))\.?(?=[\s,]|\d|$)|#/giu;

const tidy = (text: string) =>
  text
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/(, )+/g, ', ')
    .replace(/^[\s,]+|[\s,]+$/g, '');

/** The text OSM gets: labels dropped, spaces and commas tidied. */
export const cleanAddress = (address: string) => tidy(address.replace(LABELS, '$1'));

/**
 * What to ask, most precise first. OSM often lacks house numbers outside big cities, so the
 * number goes next, then leading parts one at a time. At least two parts always stay: a lone
 * "Prados de Guadalupe" matches a same-named place in another state.
 */
export function searchesFor(address: string): string[] {
  const full = cleanAddress(address);
  if (!full) return [];
  const searches = [full];
  const parts = tidy(full.replace(/\b(km\s*)?\d+[a-z]?\b/giu, ''))
    .split(', ')
    .filter(Boolean);
  for (let start = 0; parts.length - start >= 2; start++) {
    searches.push(parts.slice(start).join(', '));
  }
  return [...new Set(searches)];
}

async function search(q: string, signal?: AbortSignal): Promise<Pin | null> {
  const key = q.toLowerCase();
  const known = cache.get(key);
  if (known !== undefined) return known;
  const wait = lastRequest + timing.gapMs - Date.now();
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  lastRequest = Date.now();
  const params = new URLSearchParams({
    q,
    format: 'jsonv2',
    limit: '1',
    // Mexico ranks first (most ranches are there) without hiding the rest of the world.
    viewbox: MEXICO,
    bounded: '0',
    'accept-language': 'es',
  });
  const response = await fetch(`${NOMINATIM}?${params}`, { signal });
  if (!response.ok) throw new Error(`geocode ${response.status}`);
  const [hit] = (await response.json()) as { lat: string; lon: string }[];
  const pin = hit ? { latitude: Number(hit.lat), longitude: Number(hit.lon) } : null;
  const found = pin && Number.isFinite(pin.latitude) && Number.isFinite(pin.longitude) ? pin : null;
  cache.set(key, found);
  return found;
}

/** Where an address is, or null when OSM doesn't know it. Anywhere, Mexico first. */
export async function geocodeAddress(
  address: string,
  signal?: AbortSignal,
): Promise<Located | null> {
  const searches = searchesFor(address);
  for (const [index, q] of searches.entries()) {
    const pin = await search(q, signal);
    if (pin) return { pin, exact: index === 0 };
  }
  return null;
}
