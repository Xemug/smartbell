import * as RadixTabs from '@radix-ui/react-tabs';
import type { ReactNode } from 'react';

import { cx, focusRing } from './cx';
import type { Glyph } from './icons/glyphs';
import { Icon } from './icons/Icon';

export interface TabItem {
  value: string;
  label: string;
  icon?: Glyph;
  disabled?: boolean;
  content: ReactNode;
}

type TabsType = 'default' | 'lined' | 'solid';

interface TabsProps {
  items: TabItem[];
  /** Names the tab list. */
  label: string;
  type?: TabsType;
  size?: 'sm' | 'md';
  value?: string;
  /** The first enabled tab unless given. */
  defaultValue?: string;
  onChange?: (value: string) => void;
  className?: string;
}

const lists: Record<TabsType, string> = {
  default: 'gap-2',
  lined: 'gap-2 border-b',
  solid: 'gap-1 rounded-moon-i-sm bg-secondary-background p-1',
};

const tabs: Record<TabsType, string> = {
  default:
    'rounded-moon-i-xs text-secondary-text hover:text-primary data-[state=active]:bg-primary-10 data-[state=active]:text-primary-dark',
  lined:
    '-mb-px border-b-2 border-transparent text-secondary-text hover:text-primary data-[state=active]:border-primary data-[state=active]:text-primary',
  solid:
    'flex-1 rounded-moon-i-xs text-secondary-text hover:text-primary data-[state=active]:bg-neutral-1 data-[state=active]:text-primary data-[state=active]:shadow-moon-sm',
};

export function Tabs({
  items,
  label,
  type = 'lined',
  size = 'md',
  value,
  defaultValue,
  onChange,
  className,
}: TabsProps) {
  const first = items.find((item) => !item.disabled)?.value;
  return (
    <RadixTabs.Root
      value={value}
      defaultValue={value === undefined ? (defaultValue ?? first) : undefined}
      onValueChange={onChange}
      className={cx('flex min-w-0 flex-col gap-4', className)}
    >
      {/* Too many tabs for a phone scroll sideways rather than widen the page. */}
      <RadixTabs.List aria-label={label} className={cx('flex overflow-x-auto', lists[type])}>
        {items.map((item) => (
          <RadixTabs.Trigger
            key={item.value}
            value={item.value}
            disabled={item.disabled}
            className={cx(
              'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap px-3 transition-colors',
              size === 'sm' ? 'h-8 type-label-sm' : 'h-10 type-label-md',
              tabs[type],
              'disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:text-secondary-text',
              focusRing,
              'focus-visible:ring-inset focus-visible:ring-offset-0',
            )}
          >
            {item.icon && <Icon icon={item.icon} size={size === 'sm' ? 16 : 20} />}
            {item.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      {items.map((item) => (
        <RadixTabs.Content key={item.value} value={item.value} className={cx('rounded', focusRing)}>
          {item.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  );
}
