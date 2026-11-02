import { api } from '../../api/client';
import type { components } from '../../api/schema';

export type Account = components['schemas']['AccountOut'];
export type SessionProfile = components['schemas']['SessionRequest'];

export type SessionResult =
  { ok: true; account: Account; created: boolean } | { ok: false; code: string };

/** Ties the Firebase user to our account, creating it and "Mi rancho" the first time. */
export async function openSession(token: string, profile?: SessionProfile): Promise<SessionResult> {
  try {
    const { data, error, response } = await api.POST('/api/auth/session', {
      headers: { Authorization: `Bearer ${token}` },
      body: profile ?? {},
    });
    if (data) {
      const { created, ...account } = data;
      return { ok: true, account, created };
    }
    const detail = (error as { detail?: unknown } | undefined)?.detail;
    return { ok: false, code: typeof detail === 'string' ? detail : `http_${response.status}` };
  } catch {
    return { ok: false, code: 'network' };
  }
}
