import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { cx } from '../ui/cx';
import { iconBell } from '../ui/icons/glyphs';
import { Icon } from '../ui/icons/Icon';
import { Illustration } from '../ui/icons/Illustration';
import { AvatarMenu } from './AvatarMenu';
import { CountBadge } from './CountBadge';
import { navItems, type NavId } from './navigation';
import { NavEntry } from './NavEntry';
import { RanchSwitcher } from './RanchSwitcher';
import { focusRingOnDark } from './shellStyles';
import { useActiveRanch } from './useActiveRanch';

interface ShellProps {
  onFakeDoor: (id: NavId) => void;
  children: ReactNode;
}

export function WebShell({ onFakeDoor, children }: ShellProps) {
  const { t } = useTranslation();
  const { unreadCount, userName } = useActiveRanch();
  return (
    <div className="flex min-h-dvh flex-col bg-primary-background">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-8 bg-primary px-6">
        <Illustration name="logo-white" alt={t('app.name')} className="h-10 w-auto" />
        <nav aria-label={t('shell.mainNav')} className="flex flex-1 items-center gap-2">
          {navItems.map((item) => (
            <NavEntry
              key={item.id}
              item={item}
              onFakeDoor={onFakeDoor}
              className={cx(
                'flex h-10 items-center rounded-moon-i-xs border-b-2 border-transparent px-3 text-button-text type-label-md aria-[current=page]:border-button-text',
                focusRingOnDark,
              )}
            >
              {t(`nav.${item.id}`)}
            </NavEntry>
          ))}
        </nav>
        <Link
          to="/config/mensajes"
          aria-label={t('shell.notifications', { count: unreadCount })}
          className={cx('relative rounded-full text-button-text', focusRingOnDark)}
        >
          <Icon icon={iconBell} size={28} />
          <CountBadge count={unreadCount} />
        </Link>
        <span className="truncate text-button-text type-label-md">{userName}</span>
        <AvatarMenu />
      </header>
      <div className="flex justify-center px-6 pt-4">
        <RanchSwitcher />
      </div>
      <main className="mx-auto w-full max-w-6xl flex-1">{children}</main>
    </div>
  );
}
