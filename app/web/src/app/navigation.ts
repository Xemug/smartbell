import {
  iconCow,
  iconCalendarCheck,
  iconHome,
  iconGroups,
  iconReport,
  iconUsers,
  type Glyph,
} from '../ui/icons/glyphs';

export type NavId = 'tareas' | 'vacas' | 'grupos' | 'reportes' | 'usuarios' | 'ranchos';

export interface NavItem {
  id: NavId;
  path: string;
  icon: Glyph;
  /** Unbuilt tabs open the fake-door modal. A feature card flips this when its screen lands. */
  built: boolean;
  /** Usuarios lives in the avatar menu on mobile. */
  webOnly?: boolean;
}

export const navItems: NavItem[] = [
  { id: 'tareas', path: '/', icon: iconCalendarCheck, built: true },
  { id: 'vacas', path: '/vacas', icon: iconCow, built: true },
  { id: 'grupos', path: '/grupos', icon: iconGroups, built: false },
  { id: 'reportes', path: '/reportes', icon: iconReport, built: false },
  { id: 'usuarios', path: '/usuarios', icon: iconUsers, built: false, webOnly: true },
  { id: 'ranchos', path: '/ranchos', icon: iconHome, built: false },
];

export const mobileNavItems = navItems.filter((item) => !item.webOnly);
