import { createContext, useContext } from 'react';

export interface Ranch {
  id: string;
  name: string;
}

export interface ActiveRanchApi {
  ranches: Ranch[];
  activeRanch: Ranch;
  setActiveRanch: (id: string) => void;
  /** The count on the bell. */
  unreadCount: number;
  userName: string;
}

export const ActiveRanchContext = createContext<ActiveRanchApi | null>(null);

export function useActiveRanch(): ActiveRanchApi {
  const api = useContext(ActiveRanchContext);
  if (!api) throw new Error('useActiveRanch needs an ActiveRanchProvider above it');
  return api;
}
