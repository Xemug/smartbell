import * as Menu from '@radix-ui/react-dropdown-menu';
import { useTranslation } from 'react-i18next';

import { cx, focusRing } from '../ui/cx';
import { iconCheck, iconChevronDown } from '../ui/icons/glyphs';
import { Icon } from '../ui/icons/Icon';
import { menuContent, menuItem } from './menuStyles';
import { focusRingOnDark } from './shellStyles';
import { useActiveRanch } from './useActiveRanch';

/** `onDark` is the mobile header; on web it sits on the page, under the top bar. */
export function RanchSwitcher({ onDark = false }: { onDark?: boolean }) {
  const { t } = useTranslation();
  const { ranches, activeRanch, setActiveRanch } = useActiveRanch();
  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={t('shell.ranchSwitcher', { ranch: activeRanch.name })}
        className={cx(
          'flex h-control-md min-w-0 items-center gap-2 rounded-moon-i-xs px-3 type-body-md',
          onDark
            ? cx('text-button-text', focusRingOnDark)
            : cx('border border-neutral-2 bg-neutral-1 text-primary-text', focusRing),
        )}
      >
        <span className="truncate">{activeRanch.name}</span>
        <Icon icon={iconChevronDown} size={20} className="shrink-0" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content sideOffset={8} className={menuContent}>
          <Menu.RadioGroup value={activeRanch.id} onValueChange={setActiveRanch}>
            {ranches.map((ranch) => (
              <Menu.RadioItem key={ranch.id} value={ranch.id} className={menuItem}>
                <span className="flex-1">{ranch.name}</span>
                <Menu.ItemIndicator>
                  <Icon icon={iconCheck} size={16} />
                </Menu.ItemIndicator>
              </Menu.RadioItem>
            ))}
          </Menu.RadioGroup>
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}
