import { useMemo, useState, type ReactNode } from 'react';

import { ActiveRanchContext, type Ranch } from './useActiveRanch';

// Stub data until auth and ranch tenancy feed this context.
const firstRanch: Ranch = { id: 'rancho-1', name: 'Rancho San José' };
const stubRanches: Ranch[] = [firstRanch, { id: 'rancho-2', name: 'Rancho El Mezquite' }];

export function ActiveRanchProvider({ children }: { children: ReactNode }) {
  const [activeId, setActiveId] = useState(firstRanch.id);
  const api = useMemo(
    () => ({
      ranches: stubRanches,
      activeRanch: stubRanches.find((ranch) => ranch.id === activeId) ?? firstRanch,
      setActiveRanch: setActiveId,
      unreadCount: 4,
      userName: 'María López',
    }),
    [activeId],
  );
  return <ActiveRanchContext.Provider value={api}>{children}</ActiveRanchContext.Provider>;
}
