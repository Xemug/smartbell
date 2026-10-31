import * as RadixDialog from '@radix-ui/react-dialog';
import { useRef, useState, type PointerEvent, type ReactNode } from 'react';

import { cx } from './cx';
import { useReturnFocus } from './useReturnFocus';

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children?: ReactNode;
  footer?: ReactNode;
  /** The kit's handle; dragging it down closes the sheet. */
  dragHandle?: boolean;
  className?: string;
}

// How far down, in px, a drag has to travel to close the sheet.
const closeDistance = 80;

export function BottomSheet({
  open,
  onOpenChange,
  title,
  children,
  footer,
  dragHandle = true,
  className,
}: BottomSheetProps) {
  const { remember, onCloseAutoFocus } = useReturnFocus();
  const start = useRef<number | null>(null);
  const [offset, setOffset] = useState(0);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    start.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (start.current !== null) setOffset(Math.max(0, event.clientY - start.current));
  };
  const onPointerUp = () => {
    start.current = null;
    if (offset >= closeDistance) onOpenChange(false);
    setOffset(0);
  };

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-40 bg-scrim" />
        <RadixDialog.Content
          aria-describedby={undefined}
          onOpenAutoFocus={remember}
          onCloseAutoFocus={onCloseAutoFocus}
          style={offset ? { transform: `translateY(${offset}px)` } : undefined}
          className={cx(
            'fixed inset-x-0 bottom-0 z-40 mx-auto flex max-h-[85dvh] w-full max-w-[600px] flex-col gap-4 overflow-y-auto',
            'rounded-t-moon-s-md bg-neutral-1 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 text-primary-text shadow-moon-lg outline-none',
            'motion-safe:animate-[sheet-up_200ms_ease-out]',
            className,
          )}
        >
          {dragHandle && (
            <div
              data-testid="sheet-handle"
              aria-hidden
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={() => {
                start.current = null;
                setOffset(0);
              }}
              className="-mt-3 flex shrink-0 cursor-grab touch-none justify-center py-3"
            >
              <span className="h-1 w-10 rounded-full bg-neutral-2" />
            </div>
          )}
          <RadixDialog.Title className="ramp-card-title text-primary">{title}</RadixDialog.Title>
          {children}
          {footer && <div className="flex justify-center gap-2">{footer}</div>}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
