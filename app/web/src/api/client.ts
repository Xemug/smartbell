import createClient from 'openapi-fetch';

import type { paths } from './schema';

// Same-origin by default: the Vite dev server proxies /api to the FastAPI app.
const baseUrl = import.meta.env.VITE_API_BASE_URL ?? window.location.origin;

export const api = createClient<paths>({
  baseUrl,
  // Resolve fetch per call so tests can stub it.
  fetch: (request) => globalThis.fetch(request),
});
