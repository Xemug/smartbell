import { useMemo, useState, type ReactNode } from 'react';

import { useOptionalAuth } from '../features/auth/useAuth';
import { ActiveRanchContext, type Ranch } from './useActiveRanch';

// Only the shell's own tests render it without an AuthProvider; they get these stubs.
const stubRanches: Ranch[] = [
  { id: 'rancho-1', name: 'Rancho San José' },
  { id: 'rancho-2', name: 'Rancho El Mezquite' },
];
const noRanch: Ranch = { id: '', name: '' };

// `ranch-tenancy-permissions` adds the X-Ranch-Id header and the refetch on switch.
export function ActiveRanchProvider({ children }: { children: ReactNode }) {
  const auth = useOptionalAuth();
  const account = auth?.state.status === 'signedIn' ? auth.state.account : null;
  const [activeId, setActiveId] = useState<string | null>(null);
  const api = useMemo(() => {
    const ranches = account ? account.ranches.map(({ id, name }) => ({ id, name })) : stubRanches;
    return {
      ranches,
      activeRanch: ranches.find((ranch) => ranch.id === activeId) ?? ranches[0] ?? noRanch,
      setActiveRanch: setActiveId,
      unreadCount: account ? 0 : 4, // The real count arrives with `messages`.
      userName: account ? account.user.first_name : 'María López',
    };
  }, [account, activeId]);
  return <ActiveRanchContext.Provider value={api}>{children}</ActiveRanchContext.Provider>;
}
