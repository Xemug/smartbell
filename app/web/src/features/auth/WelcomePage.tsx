import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { buttonClass } from '../../ui/buttonStyles';
import { cx } from '../../ui/cx';
import { Illustration } from '../../ui/icons/Illustration';

const big = 'h-control-lg w-56 px-5 type-label-lg';

/** V 2901-5663. The barn photo isn't exported yet, so the splash gradient stands in for it. */
export function WelcomePage() {
  const { t } = useTranslation();
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-10 bg-gradient-to-b from-primary-dark to-primary px-4 text-center text-button-text">
      <Illustration name="logo-white" alt={t('app.name')} className="w-60 max-w-full" />
      <h1 className="max-w-xs type-heading-lg font-normal">
        <Trans i18nKey="auth.welcome.headline" components={{ b: <strong /> }} />
      </h1>
      <div className="flex flex-col items-center gap-6">
        <Link
          to="/entrar"
          className={cx(buttonClass('fill'), big, 'bg-primary ring-1 ring-neutral-1/40')}
        >
          {t('auth.welcome.login')}
        </Link>
        <Link
          to="/registro"
          className={cx(
            buttonClass('fill'),
            big,
            'bg-alternate text-primary-text hover:bg-alternate/90',
          )}
        >
          {t('auth.welcome.signup')}
        </Link>
      </div>
    </main>
  );
}
