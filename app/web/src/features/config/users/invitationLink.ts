/** Where an invite link lands; public, outside the shell. */
export const INVITATION_ROUTE = '/invitacion/:token';

export const invitationPath = (token: string) => `/invitacion/${encodeURIComponent(token)}`;

const PENDING_KEY = 'smartbell.pendingInvitation';

/** Remembered while the invitee signs up or in, so the sign-in lands back on the invite. */
export function rememberInvitation(token: string) {
  try {
    sessionStorage.setItem(PENDING_KEY, token);
  } catch {
    // Storage refused: they can open the link again after signing in.
  }
}

export function pendingInvitation(): string | null {
  try {
    return sessionStorage.getItem(PENDING_KEY);
  } catch {
    return null;
  }
}

export function forgetInvitation() {
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    // Nothing to forget.
  }
}
