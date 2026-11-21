// Google's Map Tiles API (2D roadmap tiles) for hosted builds: OpenStreetMap's tile server only
// allows low volume. The key is a browser key restricted to this site and to the Map Tiles API.
// Tiles need a session, and Google asks for its logo and the copyright of the visible area.

const TILES = 'https://tile.googleapis.com';
export const GOOGLE_LOGO = 'https://maps.gstatic.com/mapfiles/api-3/images/google_white5.png';

export interface TileSession {
  url: string;
  maxZoom: number;
  /** The copyright Google asks to show for a view, e.g. "Map data ©2026 Google, INEGI". */
  copyright: (view: Viewport) => Promise<string>;
}

export interface Viewport {
  zoom: number;
  north: number;
  south: number;
  east: number;
  west: number;
}

export async function createTileSession(key: string, signal?: AbortSignal): Promise<TileSession> {
  const response = await fetch(`${TILES}/v1/createSession?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mapType: 'roadmap', language: 'es-MX', region: 'MX' }),
    signal,
  });
  if (!response.ok) throw new Error(`tile session ${response.status}`);
  const { session } = (await response.json()) as { session?: string };
  if (!session) throw new Error('tile session missing');
  const auth = `session=${encodeURIComponent(session)}&key=${encodeURIComponent(key)}`;
  return {
    url: `${TILES}/v1/2dtiles/{z}/{x}/{y}?${auth}`,
    maxZoom: 22,
    async copyright(view) {
      const params = new URLSearchParams({
        zoom: String(Math.round(view.zoom)),
        north: String(view.north),
        south: String(view.south),
        east: String(view.east),
        west: String(view.west),
      });
      const viewport = await fetch(`${TILES}/tile/v1/viewport?${auth}&${params}`);
      if (!viewport.ok) return 'Google';
      const { copyright } = (await viewport.json()) as { copyright?: string };
      return copyright ? `Map data ©${new Date().getFullYear()} ${copyright}` : 'Google';
    },
  };
}
