import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { cx } from '../ui/cx';
import { iconBell } from '../ui/icons/glyphs';
import { Icon } from '../ui/icons/Icon';
import { AvatarMenu } from './AvatarMenu';
import { mobileNavItems, type NavId } from './navigation';
import { NavEntry } from './NavEntry';
import { RanchSwitcher } from './RanchSwitcher';
import { focusRingOnDark } from './shellStyles';

interface ShellProps {
  onFakeDoor: (id: NavId) => void;
  children: ReactNode;
}

export function MobileShell({ onFakeDoor, children }: ShellProps) {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-dvh flex-col bg-primary-background">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 bg-primary px-4">
        <Icon icon={iconBell} size={28} className="shrink-0 text-button-text" />
        <div className="flex min-w-0 flex-1">
          <RanchSwitcher onDark />
        </div>
        <AvatarMenu showCount />
      </header>
      {/* Clears the fixed tab bar. */}
      <main className="flex-1 pb-20">{children}</main>
      <nav
        aria-label={t('shell.mainNav')}
        className="fixed inset-x-0 bottom-0 z-30 flex bg-primary pb-[env(safe-area-inset-bottom)]"
      >
        {mobileNavItems.map((item) => (
          <NavEntry
            key={item.id}
            item={item}
            onFakeDoor={onFakeDoor}
            className={cx(
              'flex h-16 min-w-0 flex-1 flex-col items-center justify-center gap-1 text-button-text/80 type-label-sm aria-[current=page]:bg-primary-dark aria-[current=page]:text-button-text',
              focusRingOnDark,
            )}
          >
            <Icon icon={item.icon} size={24} />
            {t(`nav.${item.id}`)}
          </NavEntry>
        ))}
      </nav>
    </div>
  );
}
