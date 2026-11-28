import { useTranslation } from 'react-i18next';

import { Button } from '../../../ui/Button';
import { today } from '../eventTypes';
import type { EventFlowProps } from '../flows';

/**
 * The heat prompt of an automatic heat task (v4-onboarding-dashboard-tasks §1.12): "No entró"
 * records outcome ① and ends the flow. "Sí, confirmar" opens the heat decision tree, which the
 * heat-flow card builds; until then it is shown but disabled.
 */
export function HeatPrompt({ animal, record, recording }: EventFlowProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-4">
      <p className="type-body-md">
        {t('events.heat.intro', { kind: t(`profile.kinds.${animal.kind}`), id: animal.control_id })}
      </p>
      <h3 className="ramp-section-title">{t('events.heat.question')}</h3>
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          variant="danger"
          loading={recording}
          onClick={() =>
            record({ occurred_on: today(), payload: { type: 'HEAT', outcome: 'NOT_OBSERVED' } })
          }
        >
          {t('events.heat.notObserved')}
        </Button>
        <Button disabled aria-describedby="heat-confirm-soon">
          {t('events.heat.confirm')}
        </Button>
      </div>
      <p id="heat-confirm-soon" className="text-secondary-text type-body-sm">
        {t('events.heat.confirmSoon')}
      </p>
    </div>
  );
}
