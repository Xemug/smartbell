import * as Menu from '@radix-ui/react-dropdown-menu';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { iconLogOut, iconMessage, iconSettings, iconUser, iconUsers } from '../ui/icons/glyphs';
import type { Glyph } from '../ui/icons/glyphs';
import { Icon } from '../ui/icons/Icon';
import { Illustration } from '../ui/icons/Illustration';
import { focusRingOnDark } from './shellStyles';
import { CountBadge } from './CountBadge';
import { menuContent, menuItem } from './menuStyles';
import { useActiveRanch } from './useActiveRanch';
import { useSnackbar } from '../ui/useSnackbar';
import { whatsappUrl } from './whatsapp';
import { cx } from '../ui/cx';

const configItems: { key: string; path: string; icon: Glyph }[] = [
  { key: 'profile', path: '/config/perfil', icon: iconUser },
  { key: 'ranches', path: '/config/ranchos', icon: iconSettings },
  { key: 'messages', path: '/config/mensajes', icon: iconMessage },
  { key: 'users', path: '/config/usuarios', icon: iconUsers },
];

export function AvatarMenu({ showCount = false }: { showCount?: boolean }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const { unreadCount } = useActiveRanch();
  const count = showCount ? unreadCount : 0;
  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={count > 0 ? t('shell.accountMenuCount', { count }) : t('shell.accountMenu')}
        className={cx('relative size-10 shrink-0 rounded-full', focusRingOnDark)}
      >
        <Illustration name="avatar" alt="" className="size-10 rounded-full" />
        <CountBadge count={count} />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content align="end" sideOffset={8} className={menuContent}>
          {configItems.map((item) => (
            <Menu.Item key={item.key} className={menuItem} onSelect={() => navigate(item.path)}>
              <Icon icon={item.icon} size={20} />
              {t(`config.${item.key}`)}
            </Menu.Item>
          ))}
          <Menu.Item asChild className={menuItem}>
            <a
              href={whatsappUrl(t('shell.supportPrefill'))}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon icon={iconMessage} size={20} />
              {t('shell.support')}
            </a>
          </Menu.Item>
          <Menu.Item
            className={menuItem}
            // Auth has not landed, so there is no session to end yet.
            onSelect={() => snackbar.show({ message: t('shell.logoutSoon') })}
          >
            <Icon icon={iconLogOut} size={20} />
            {t('shell.logout')}
          </Menu.Item>
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}
