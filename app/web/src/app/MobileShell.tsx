import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { cx } from '../ui/cx';
import { iconBell } from '../ui/icons/glyphs';
import { Icon } from '../ui/icons/Icon';
import { AvatarMenu } from './AvatarMenu';
import { mobileNavItems, type NavId } from './navigation';
import { NavEntry } from './NavEntry';
import { RanchSwitcher } from './RanchSwitcher';
import { focusRingOnDark } from './shellStyles';

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 bg-primary px-4">
      <Icon icon={iconBell} size={28} className="shrink-0 text-button-text" />
      <div className="flex min-w-0 flex-1">
        <RanchSwitcher onDark />
      </div>
      <AvatarMenu showCount />
    </header>
  );
}

export function MobileTabBar({ onFakeDoor }: { onFakeDoor: (id: NavId) => void }) {
  const { t } = useTranslation();

  // The snackbar layer lives above the router, so it learns the bar's height from here.
  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty('--snackbar-lift', '4rem');
    return () => {
      root.removeProperty('--snackbar-lift');
    };
  }, []);

  return (
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
            'flex h-16 min-w-0 flex-1 flex-col items-center justify-center gap-1 text-button-text type-label-sm aria-[current=page]:bg-primary-dark',
            focusRingOnDark,
          )}
        >
          <Icon icon={item.icon} size={24} />
          {t(`nav.${item.id}`)}
        </NavEntry>
      ))}
    </nav>
  );
}
