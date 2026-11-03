import createClient from 'openapi-fetch';

import type { paths } from './schema';

// Same-origin by default: the Vite dev server proxies /api to the FastAPI app.
const baseUrl = import.meta.env.VITE_API_BASE_URL ?? window.location.origin;

export const api = createClient<paths>({
  baseUrl,
  // Resolve fetch per call so tests can stub it.
  fetch: (request) => globalThis.fetch(request),
});

let getToken: (() => Promise<string | null>) | null = null;
let activeRanchId: string | null = null;

/** The AuthProvider registers where the current ID token comes from. */
export function setTokenGetter(getter: (() => Promise<string | null>) | null) {
  getToken = getter;
}

/** The ActiveRanchProvider sets the ranch every ranch-scoped call acts on. */
export function setActiveRanchId(id: string | null) {
  activeRanchId = id;
}

// Every call carries the active ranch, and the API's guard checks the user belongs to it.
api.use({
  onRequest({ request }) {
    if (activeRanchId && !request.headers.has('X-Ranch-Id')) {
      request.headers.set('X-Ranch-Id', activeRanchId);
    }
    return request;
  },
});

// Every call carries the signed-in user's Firebase ID token, refreshed by the SDK as it expires.
api.use({
  async onRequest({ request }) {
    if (request.headers.has('Authorization') || !getToken) return request;
    const token = await getToken();
    if (token) request.headers.set('Authorization', `Bearer ${token}`);
    return request;
  },
});
