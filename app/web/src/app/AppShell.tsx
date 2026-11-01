import { useState } from 'react';
import { Outlet, ScrollRestoration } from 'react-router-dom';

import { cx } from '../ui/cx';
import { ActiveRanchProvider } from './ActiveRanchProvider';
import { FakeDoorModal } from './FakeDoorModal';
import { MobileHeader, MobileTabBar } from './MobileShell';
import type { NavId } from './navigation';
import { RanchSwitcher } from './RanchSwitcher';
import { useIsDesktop } from './useIsDesktop';
import { WebHeader } from './WebShell';

// Only the chrome swaps at the breakpoint. `<main>` stays put, so rotating a tablet keeps whatever
// the page holds: a half-filled form, its focus, its scroll.
export function AppShell() {
  const isDesktop = useIsDesktop();
  const [fakeDoor, setFakeDoor] = useState<NavId | null>(null);
  return (
    <ActiveRanchProvider>
      <ScrollRestoration />
      <div className="flex min-h-dvh flex-col bg-primary-background">
        {isDesktop ? <WebHeader onFakeDoor={setFakeDoor} /> : <MobileHeader />}
        <main
          className={cx(
            'flex-1',
            isDesktop
              ? 'mx-auto w-full max-w-6xl'
              : // Clears the fixed tab bar.
                'pb-[calc(5rem+env(safe-area-inset-bottom))]',
          )}
        >
          {isDesktop && (
            <div className="flex justify-center px-6 pt-4">
              <RanchSwitcher />
            </div>
          )}
          <Outlet />
        </main>
        {!isDesktop && <MobileTabBar onFakeDoor={setFakeDoor} />}
      </div>
      <FakeDoorModal feature={fakeDoor} onClose={() => setFakeDoor(null)} />
    </ActiveRanchProvider>
  );
}
