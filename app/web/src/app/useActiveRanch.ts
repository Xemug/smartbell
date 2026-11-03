import { createContext, useContext } from 'react';

import type { components } from '../api/schema';

export type Permission = components['schemas']['Permission'];
export type Role = components['schemas']['Role'];

export interface Ranch {
  id: string;
  name: string;
  /** The user's role and permission codes there (domain-model §7.8); absent in the shell stubs. */
  role?: Role;
  permissions?: Permission[];
}

export interface ActiveRanchApi {
  ranches: Ranch[];
  activeRanch: Ranch;
  /** Persists the choice and refetches every query, since all data is per ranch. */
  setActiveRanch: (id: string) => void;
  /** Whether the user may do this in the active ranch. The API enforces it either way. */
  can: (permission: Permission) => boolean;
  /** The count on the bell. */
  unreadCount: number;
  userName: string;
}

/** Where the choice is kept: per user, so a shared device doesn't open someone else's ranch. */
export const activeRanchKey = (userId: string) => `smartbell.activeRanch.${userId}`;

export const ActiveRanchContext = createContext<ActiveRanchApi | null>(null);

export function useActiveRanch(): ActiveRanchApi {
  const api = useContext(ActiveRanchContext);
  if (!api) throw new Error('useActiveRanch needs an ActiveRanchProvider above it');
  return api;
}
