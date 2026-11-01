import { useRef, type ReactNode, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from './Button';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  /** Paints the confirm button red, for what cannot be undone. */
  danger?: boolean;
  /** Keeps the dialog up while the action runs: Escape does nothing until it ends. */
  loading?: boolean;
  /** Receives focus on close, when set. */
  returnFocus?: RefObject<HTMLElement>;
}

// Stays open after confirming unless the caller closes it, so a failed action can be retried.
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  danger = false,
  loading = false,
  returnFocus,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const cancel = useRef<HTMLButtonElement>(null);
  return (
    <Modal
      alert
      open={open}
      onOpenChange={(next) => {
        if (!loading) onOpenChange(next);
      }}
      returnFocus={returnFocus}
      title={title}
      description={description}
      closeButton={false}
      // A stray Enter must not destroy anything.
      initialFocus={danger ? cancel : undefined}
      footer={
        <>
          <Button
            ref={cancel}
            variant="outline"
            disabled={loading}
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel ?? t('ui.cancel')}
          </Button>
          <Button variant={danger ? 'danger' : 'fill'} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
