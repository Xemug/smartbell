import * as RadixDialog from '@radix-ui/react-dialog';
import type { ReactNode, RefObject } from 'react';
import { useTranslation } from 'react-i18next';

import { cx } from './cx';
import { IconButton } from './IconButton';
import { iconX } from './icons/glyphs';
import { useReturnFocus } from './useReturnFocus';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  /** Actions, right-aligned under the content. */
  footer?: ReactNode;
  /** The kit's "Close button" variant. */
  closeButton?: boolean;
  /** For ConfirmDialog: announces as an alert and ignores clicks outside. */
  alert?: boolean;
  /** Receives focus on open; by default it is the first control. */
  initialFocus?: RefObject<HTMLElement>;
  className?: string;
}

// The web event dialogs: 534 wide with 24 padding, and full width under that.
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  closeButton = true,
  alert = false,
  initialFocus,
  className,
}: ModalProps) {
  const { t } = useTranslation();
  const { remember, onCloseAutoFocus } = useReturnFocus();
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-40 bg-scrim" />
        <RadixDialog.Content
          role={alert ? 'alertdialog' : 'dialog'}
          // Without a description Radix expects this to be cleared explicitly.
          {...(description ? {} : { 'aria-describedby': undefined })}
          onCloseAutoFocus={onCloseAutoFocus}
          onOpenAutoFocus={(event) => {
            remember();
            if (!initialFocus?.current) return;
            event.preventDefault();
            initialFocus.current.focus();
          }}
          onPointerDownOutside={(event) => alert && event.preventDefault()}
          onInteractOutside={(event) => alert && event.preventDefault()}
          className={cx(
            'fixed left-1/2 top-1/2 z-40 flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-[534px] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto',
            'rounded-moon-i-md bg-neutral-1 p-6 text-primary-text shadow-moon-lg outline-none',
            className,
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <RadixDialog.Title className="ramp-card-title text-primary">{title}</RadixDialog.Title>
            {closeButton && (
              <RadixDialog.Close asChild>
                <IconButton
                  icon={iconX}
                  label={t('ui.close')}
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                />
              </RadixDialog.Close>
            )}
          </div>
          {description && (
            <RadixDialog.Description className="type-body-md">
              {description}
            </RadixDialog.Description>
          )}
          {children}
          {footer && <div className="flex flex-wrap justify-end gap-2">{footer}</div>}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
