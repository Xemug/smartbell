import { useTranslation } from 'react-i18next';

import { useHealth } from '../api/health';

export function HomePage() {
  const { t } = useTranslation();
  const health = useHealth();

  let status = t('health.loading');
  if (health.isError) status = t('health.error');
  else if (health.data) status = health.data.status;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-3xl font-bold text-[#1460AA]">{t('app.name')}</h1>
      <p className="text-gray-700">
        {t('health.label')}: <span data-testid="api-health">{status}</span>
      </p>
    </main>
  );
}
