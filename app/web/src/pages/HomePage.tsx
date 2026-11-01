import { useTranslation } from 'react-i18next';

import { useHealth } from '../api/health';

export function HomePage() {
  const { t } = useTranslation();
  const health = useHealth();

  let status = t('health.loading');
  if (health.isError) status = t('health.error');
  else if (health.data) status = health.data.status;

  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-4 p-4">
      <h1 className="ramp-page-title text-primary">{t('app.name')}</h1>
      <p className="ramp-body text-secondary-text">
        {t('health.label')}: <span data-testid="api-health">{status}</span>
      </p>
    </div>
  );
}
