import { useTranslation } from 'react-i18next';

import { EmptyState } from '../ui/EmptyState';

/** Holds a route until its feature card lands. */
export function PlaceholderPage({ titleKey }: { titleKey: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="ramp-page-title text-primary">{t(titleKey)}</h1>
      <EmptyState illustration="cow-sitted" title={t('fakeDoor.title')} />
    </div>
  );
}
