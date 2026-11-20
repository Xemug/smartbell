import { useTranslation } from 'react-i18next';

import { useSupportLinks } from '../../../app/support';
import { buttonClass } from '../../../ui/buttonStyles';
import { cx } from '../../../ui/cx';
import { EmptyState } from '../../../ui/EmptyState';

/**
 * Shown instead of inviting when the ranch has no Pro. `plans-billing` is parked, so there is no
 * purchase flow: "Ver planes" opens the support WhatsApp, as the live app's See Plans door does.
 */
export function UpsellState({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  const links = useSupportLinks();
  const href = links.feature(t('config.users'));
  const cta = (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cx(buttonClass('fill'), 'h-control-md gap-2 px-4 type-label-md')}
    >
      {t('users.upsell.cta')}
    </a>
  );
  if (compact)
    return (
      <div
        role="status"
        className="flex flex-wrap items-center justify-between gap-3 rounded-moon-i-sm bg-info-10 p-4"
      >
        <span className="flex flex-col gap-1">
          <span className="text-primary-text type-label-lg">{t('users.upsell.title')}</span>
          <span className="text-secondary-text type-body-md">{t('users.upsell.body')}</span>
        </span>
        {cta}
      </div>
    );
  return (
    <EmptyState
      illustration="cow-sitted"
      title={t('users.upsell.title')}
      description={t('users.upsell.body')}
      action={cta}
    />
  );
}
