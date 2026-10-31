import { useTranslation } from 'react-i18next';

import { cx } from './cx';
import { ProgressBar } from './ProgressBar';

interface StepperProps {
  /** Current step, counted from 1. */
  step: number;
  total: number;
  className?: string;
}

// The wizards' "Steper Bar 1/N": progress through a multi-step form.
export function Stepper({ step, total, className }: StepperProps) {
  const { t } = useTranslation();
  const label = t('ui.step', { step, total });
  return (
    <div className={cx('flex flex-col gap-1', className)}>
      <span className="type-label-sm text-secondary-text">{label}</span>
      <ProgressBar label={label} value={step} max={total} />
    </div>
  );
}
