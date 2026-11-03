import { useTranslation } from 'react-i18next';

import { Illustration } from '../../ui/icons/Illustration';

/** V 2901-5671: shown while Firebase restores the session and the API opens the account. */
export function SplashScreen() {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      aria-label={t('auth.loading')}
      className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-alternate to-primary px-4"
    >
      <Illustration name="logo-white" alt={t('app.name')} className="w-56 max-w-full" />
    </div>
  );
}
