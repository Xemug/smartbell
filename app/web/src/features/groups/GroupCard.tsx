import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Card } from '../../ui/Card';
import { Icon } from '../../ui/icons/Icon';
import type { Glyph } from '../../ui/icons/glyphs';
import { SplitIndicator } from '../../ui/SplitIndicator';

interface GroupCardProps {
  title: string;
  description: string | null;
  countLabel: string;
  count: number;
  kpi?: { icon: Glyph; label: string; value: string } | null;
  /** Editar / Eliminar / Ver más. */
  actions: ReactNode;
}

/** The `Group Chip` card of C1 / 1.12: name, description, count, optional indicator, actions. */
export function GroupCard({ title, description, countLabel, count, kpi, actions }: GroupCardProps) {
  const { t } = useTranslation();
  return (
    <Card
      className="h-full"
      title={<span className="block text-center">{title}</span>}
      footer={<div className="flex w-full justify-between gap-2">{actions}</div>}
    >
      {description && <p className="text-secondary-text type-body-sm">{description}</p>}
      <SplitIndicator label={countLabel} count={count} />
      {kpi ? (
        <div className="flex items-center gap-4">
          <Icon icon={kpi.icon} size={64} />
          <div className="flex flex-col items-center">
            <span className="text-primary type-body-md">{kpi.label}</span>
            <span className="ramp-kpi text-primary">{kpi.value}</span>
          </div>
        </div>
      ) : (
        <p className="sr-only">{t('groups.kpi.none')}</p>
      )}
    </Card>
  );
}
