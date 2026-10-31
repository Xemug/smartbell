import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from './Button';
import { ConfirmDialog } from './ConfirmDialog';
import { cx } from './cx';
import { iconChevronLeft, iconChevronRight } from './icons/glyphs';
import { Stepper } from './Stepper';

interface WizardProps {
  /** One title per step. */
  steps: string[];
  /** Current step, counted from 0. The caller moves it from `onNext` and `onBack`. */
  step: number;
  /** The current step's content. */
  children: ReactNode;
  /** There is unsaved data, so Regresar asks before going back. */
  dirty?: boolean;
  onNext: () => void;
  /** Called once it is safe to go back: at once if clean, after confirming if dirty. */
  onBack?: () => void;
  /** Runs just before `onBack` when the user agreed to lose the data. Reset the form here. */
  onDiscard?: () => void;
  nextLabel?: string;
  /** For the last step. */
  finishLabel?: string;
  nextDisabled?: boolean;
  nextLoading?: boolean;
  className?: string;
}

// Step header with progress bar, the step, and Regresar / Continuar. The confirmation is ours: the
// designs ask for it (event-flows.md §3.3) but do not draw it.
export function Wizard({
  steps,
  step,
  children,
  dirty = false,
  onNext,
  onBack,
  onDiscard,
  nextLabel,
  finishLabel,
  nextDisabled,
  nextLoading,
  className,
}: WizardProps) {
  const { t } = useTranslation();
  const [confirming, setConfirming] = useState(false);
  const last = step >= steps.length - 1;
  // Set on discard, so closing the dialog lands on the new step rather than on Regresar.
  const afterDiscard = useRef<HTMLElement | null>(null);

  // A new step replaces the content, so focus moves with it instead of falling to the page.
  const heading = useRef<HTMLHeadingElement>(null);
  const shownStep = useRef(step);
  useEffect(() => {
    if (shownStep.current !== step) heading.current?.focus();
    shownStep.current = step;
  }, [step]);

  return (
    <div className={cx('flex flex-col gap-4', className)}>
      <header className="flex flex-col gap-2">
        <Stepper step={step + 1} total={steps.length} />
        <h2 ref={heading} tabIndex={-1} className="ramp-section-title outline-none">
          {steps[step]}
        </h2>
      </header>
      <div>{children}</div>
      <footer className="flex flex-wrap items-center justify-between gap-2">
        {onBack ? (
          <Button
            variant="ghost"
            leadingIcon={iconChevronLeft}
            onClick={() => {
              afterDiscard.current = null;
              if (dirty) setConfirming(true);
              else onBack();
            }}
          >
            {t('ui.back')}
          </Button>
        ) : (
          <span />
        )}
        <Button
          trailingIcon={last ? undefined : iconChevronRight}
          disabled={nextDisabled}
          loading={nextLoading}
          onClick={onNext}
        >
          {last ? (finishLabel ?? t('ui.finish')) : (nextLabel ?? t('ui.next'))}
        </Button>
      </footer>
      <ConfirmDialog
        danger
        open={confirming}
        onOpenChange={setConfirming}
        returnFocus={afterDiscard}
        title={t('ui.discardTitle')}
        description={t('ui.discardBody')}
        confirmLabel={t('ui.discardConfirm')}
        cancelLabel={t('ui.keepEditing')}
        onConfirm={() => {
          afterDiscard.current = heading.current;
          setConfirming(false);
          onDiscard?.();
          onBack?.();
        }}
      />
    </div>
  );
}
