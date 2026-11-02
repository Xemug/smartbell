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

/** The AuthProvider registers where the current ID token comes from. */
export function setTokenGetter(getter: (() => Promise<string | null>) | null) {
  getToken = getter;
}

// Every call carries the signed-in user's Firebase ID token, refreshed by the SDK as it expires.
api.use({
  async onRequest({ request }) {
    if (request.headers.has('Authorization') || !getToken) return request;
    const token = await getToken();
    if (token) request.headers.set('Authorization', `Bearer ${token}`);
    return request;
  },
});
