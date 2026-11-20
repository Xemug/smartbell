import { useTranslation } from 'react-i18next';

import type { Permission } from '../../../app/useActiveRanch';
import { Tabs } from '../../../ui/Tabs';
import { Toggle } from '../../../ui/Toggle';
import { permissionCategories } from './permissions';

interface PermissionsPanelProps {
  selected: ReadonlySet<Permission>;
  /** What the chosen role may hold (§7.8), further limited to what the editor holds. */
  allowed: ReadonlySet<Permission>;
  onChange: (code: Permission, on: boolean) => void;
}

/** "Personalizar permisos": one tab per category, a toggle per permission (E8). */
export function PermissionsPanel({ selected, allowed, onChange }: PermissionsPanelProps) {
  const { t } = useTranslation();
  return (
    <Tabs
      label={t('users.form.tabPermissions')}
      type="lined"
      size="sm"
      defaultValue="ganado"
      items={permissionCategories.map((category) => ({
        value: category.key,
        label: t(`users.categories.${category.key}`),
        content: (
          <ul className="flex flex-col gap-3 py-3">
            {category.codes.map((code) => {
              const locked = !allowed.has(code);
              return (
                <li key={code} className="flex items-center justify-between gap-3">
                  <span className="flex flex-col">
                    <span className="text-primary-text type-body-md">
                      {t(`users.permissions.${code}`)}
                    </span>
                    {locked && (
                      <span className="text-secondary-text type-body-sm">
                        {t('users.form.permissionsLocked')}
                      </span>
                    )}
                  </span>
                  <Toggle
                    size="xs"
                    aria-label={t(`users.permissions.${code}`)}
                    value={selected.has(code) && !locked}
                    disabled={locked}
                    onChange={(on) => onChange(code, on)}
                  />
                </li>
              );
            })}
          </ul>
        ),
      }))}
    />
  );
}
