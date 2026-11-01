import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

import type { NavId, NavItem } from './navigation';

interface NavEntryProps {
  item: NavItem;
  onFakeDoor: (id: NavId) => void;
  className: string;
  children: ReactNode;
}

// One tab: a link once the feature exists, a fake door before that. `aria-current` is the styling
// hook for the active tab.
export function NavEntry({ item, onFakeDoor, className, children }: NavEntryProps) {
  if (!item.built) {
    return (
      <button type="button" className={className} onClick={() => onFakeDoor(item.id)}>
        {children}
      </button>
    );
  }
  return (
    <NavLink to={item.path} end={item.path === '/'} className={className}>
      {children}
    </NavLink>
  );
}
