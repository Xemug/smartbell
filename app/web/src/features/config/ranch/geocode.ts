import { api } from '../../../api/client';
import type { Pin } from './pin';

// Hosted builds set VITE_GEOCODE_VIA_API: lookups go through our API, which asks Google with a
// server-side key. Otherwise (dev) the browser asks OpenStreetMap's free geocoder directly.
// OpenStreetMap's free geocoder, the same data as the map tiles. Its usage policy allows one
// request a second and no search-as-you-type, so callers look up a finished address (on blur or
// on save) or a dropped pin, never per keystroke, and requests here are spaced out; the browser's
// Referer identifies the app.
const NOMINATIM = 'https://nominatim.openstreetmap.org';

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

/** One request to Nominatim, at most one a second across the page. */
async function ask<T>(path: string, params: URLSearchParams, signal?: AbortSignal): Promise<T> {
  const wait = lastRequest + timing.gapMs - Date.now();
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  lastRequest = Date.now();
  const response = await fetch(`${NOMINATIM}${path}?${params}`, { signal });
  if (!response.ok) throw new Error(`geocode ${response.status}`);
  return (await response.json()) as T;
}

/** Read per call so tests can stub it. */
const viaApi = () => import.meta.env.VITE_GEOCODE_VIA_API === 'true';

async function searchApi(q: string, signal?: AbortSignal): Promise<Pin | null> {
  const { data, error } = await api.GET('/api/geocode/search', {
    params: { query: { q } },
    signal,
  });
  if (error || !data) throw new Error('geocode');
  return data.pin;
}

async function search(q: string, signal?: AbortSignal): Promise<Pin | null> {
  const key = q.toLowerCase();
  const known = cache.get(key);
  if (known !== undefined) return known;
  if (viaApi()) {
    const pin = await searchApi(q, signal);
    cache.set(key, pin);
    return pin;
  }
  const params = new URLSearchParams({
    q,
    format: 'jsonv2',
    limit: '1',
    // Mexico ranks first (most ranches are there) without hiding the rest of the world.
    viewbox: MEXICO,
    bounded: '0',
    'accept-language': 'es',
  });
  const [hit] = await ask<{ lat: string; lon: string }[]>('/search', params, signal);
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
  const typed = parseCoordinates(address);
  if (typed) return { pin: typed, exact: true };
  const searches = searchesFor(address);
  for (const [index, q] of searches.entries()) {
    const pin = await search(q, signal);
    if (pin) return { pin, exact: index === 0 };
  }
  return null;
}

// "20.95, -102.6" or "20.95 -102.6": a spot with no street, written as its coordinates.
const COORDINATES = /^\s*(-?\d{1,2}(?:\.\d+)?)\s*[,\s]\s*(-?\d{1,3}(?:\.\d+)?)\s*$/u;

/** The pin an address that is just coordinates names, or null. */
export function parseCoordinates(text: string): Pin | null {
  const match = COORDINATES.exec(text);
  if (!match) return null;
  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { latitude, longitude };
}

/** How a pin with no street is written in the address field. */
export const formatCoordinates = ({ latitude, longitude }: Pin) =>
  `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

interface ReverseHit {
  address?: Partial<
    Record<
      | 'road'
      | 'house_number'
      | 'neighbourhood'
      | 'suburb'
      | 'quarter'
      | 'city'
      | 'town'
      | 'village'
      | 'municipality'
      | 'state'
      | 'country'
      | 'country_code',
      string
    >
  >;
}

/**
 * The street address at a pin ("Calle Joseph Haydn 4942, Prados Guadalupe, Zapopan, Jalisco"),
 * or null where there is no street nearby: out in the fields, the coordinates are the address.
 */
export async function addressAt(pin: Pin, signal?: AbortSignal): Promise<string | null> {
  if (viaApi()) {
    const { data, error } = await api.GET('/api/geocode/reverse', {
      params: { query: { latitude: pin.latitude, longitude: pin.longitude } },
      signal,
    });
    if (error || !data) throw new Error('geocode');
    return data.address;
  }
  const params = new URLSearchParams({
    lat: String(pin.latitude),
    lon: String(pin.longitude),
    format: 'jsonv2',
    zoom: '17', // Street level: a farther guess would name the wrong place.
    addressdetails: '1',
    'accept-language': 'es',
  });
  const hit = await ask<ReverseHit>('/reverse', params, signal);
  const a = hit.address;
  if (!a?.road) return null;
  const parts = [
    [a.road, a.house_number].filter(Boolean).join(' '),
    a.neighbourhood ?? a.suburb ?? a.quarter,
    a.city ?? a.town ?? a.village ?? a.municipality,
    a.state,
    a.country_code && a.country_code !== 'mx' ? a.country : undefined,
  ];
  return [...new Set(parts.filter(Boolean))].join(', ');
}
