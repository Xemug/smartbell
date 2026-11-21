import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';

import { cx, focusRing } from '../../ui/cx';

const tabs = [
  { key: 'account', path: '/config/perfil' },
  { key: 'ranch', path: '/config/ranchos' },
  // Vacunación y Desarrollo joins with `vaccination-plan`.
] as const;

/**
 * The configuration hub (M 1691-104, W 1315:53819): one route per tab, so the avatar menu's
 * Mi perfil and Mis ranchos land on their own tab. One column on a phone, a card from 960px.
 */
export function ConfigLayout({ intro, children }: { intro: string; children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4 lg:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="ramp-page-title text-primary">{t('config.title')}</h1>
        <p className="text-secondary-text type-body-md">{intro}</p>
      </div>
      <nav aria-label={t('config.tabs')} className="flex gap-2 overflow-x-auto border-b">
        {tabs.map((tab) => (
          <NavLink
            key={tab.key}
            to={tab.path}
            className={({ isActive }) =>
              cx(
                'inline-flex h-10 shrink-0 items-center whitespace-nowrap border-b-2 px-3 transition-colors type-label-md',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-secondary-text hover:text-primary',
                focusRing,
                'focus-visible:ring-inset focus-visible:ring-offset-0',
              )
            }
          >
            {t(`config.${tab.key}.tab`)}
          </NavLink>
        ))}
      </nav>
      <div className="flex flex-col gap-4 lg:rounded-moon-i-sm lg:bg-neutral-1 lg:p-6 lg:shadow-moon-sm">
        {children}
      </div>
    </div>
  );
}
