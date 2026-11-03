import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState, type ReactNode } from 'react';

import { setActiveRanchId } from '../api/client';
import { useOptionalAuth } from '../features/auth/useAuth';
import { ActiveRanchContext, activeRanchKey, type Permission, type Ranch } from './useActiveRanch';

// Only the shell's own tests render it without an AuthProvider; they get these stubs.
const stubRanches: Ranch[] = [
  { id: 'rancho-1', name: 'Rancho San José' },
  { id: 'rancho-2', name: 'Rancho El Mezquite' },
];
const noRanch: Ranch = { id: '', name: '' };

// Storage can be missing or refuse (private mode); the first ranch is then the fallback.
function readStored(key: string | null): string | null {
  if (!key) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStored(key: string | null, id: string) {
  if (!key) return;
  try {
    localStorage.setItem(key, id);
  } catch {
    // Not remembered across reloads; the switch itself still works.
  }
}

export function ActiveRanchProvider({ children }: { children: ReactNode }) {
  const auth = useOptionalAuth();
  const queryClient = useQueryClient();
  const account = auth?.state.status === 'signedIn' ? auth.state.account : null;
  const storageKey = account ? activeRanchKey(account.user.id) : null;
  // Keyed by user: whoever signs in next starts from their own stored choice.
  const [chosen, setChosen] = useState<{ key: string | null; id: string | null }>({
    key: storageKey,
    id: readStored(storageKey),
  });
  const activeId = chosen.key === storageKey ? chosen.id : readStored(storageKey);

  const ranches = useMemo<Ranch[]>(() => account?.ranches ?? stubRanches, [account]);
  const activeRanch = ranches.find((ranch) => ranch.id === activeId) ?? ranches[0] ?? noRanch;
  // Set during render, not in an effect: children's queries start in their effects, which run
  // before this component's own, and must already carry the right ranch.
  setActiveRanchId(account ? activeRanch.id || null : null);

  const setActiveRanch = useCallback(
    (id: string) => {
      if (id === activeRanch.id || !ranches.some((ranch) => ranch.id === id)) return;
      setChosen({ key: storageKey, id });
      writeStored(storageKey, id);
      setActiveRanchId(id);
      // Reset, not invalidate: the old ranch's data must not show while the new one loads.
      void queryClient.resetQueries();
    },
    [activeRanch.id, ranches, storageKey, queryClient],
  );

  const api = useMemo(
    () => ({
      ranches,
      activeRanch,
      setActiveRanch,
      can: (permission: Permission) => activeRanch.permissions?.includes(permission) ?? false,
      unreadCount: account ? 0 : 4, // The real count arrives with `messages`.
      userName: account ? account.user.first_name : 'María López',
    }),
    [account, ranches, activeRanch, setActiveRanch],
  );
  return <ActiveRanchContext.Provider value={api}>{children}</ActiveRanchContext.Provider>;
}
