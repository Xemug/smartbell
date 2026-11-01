import { useState } from 'react';
import { Outlet } from 'react-router-dom';

import { ActiveRanchProvider } from './ActiveRanchProvider';
import { FakeDoorModal } from './FakeDoorModal';
import { MobileShell } from './MobileShell';
import type { NavId } from './navigation';
import { useIsDesktop } from './useIsDesktop';
import { WebShell } from './WebShell';

export function AppShell() {
  const isDesktop = useIsDesktop();
  const [fakeDoor, setFakeDoor] = useState<NavId | null>(null);
  const Shell = isDesktop ? WebShell : MobileShell;
  return (
    <ActiveRanchProvider>
      <Shell onFakeDoor={setFakeDoor}>
        <Outlet />
      </Shell>
      <FakeDoorModal feature={fakeDoor} onClose={() => setFakeDoor(null)} />
    </ActiveRanchProvider>
  );
}
