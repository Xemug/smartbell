import { useRef, type RefObject } from 'react';

/** Marks the snackbar layer, which sits above dialogs but outside their React tree. */
export const snackbarLayer = 'data-snackbar-layer';

/** Outside-click check for dialogs: dismissing a snackbar must not close what is under it. */
export function fromSnackbar(event: { detail: { originalEvent: Event } }): boolean {
  const target = event.detail.originalEvent.target;
  return target instanceof Element && target.closest(`[${snackbarLayer}]`) !== null;
}

// Radix returns focus only to its own Trigger. Ours are controlled from any button, so without this
// closing a dialog would drop a keyboard user at the top of the page. `override`, when set, wins.
export function useReturnFocus(override?: RefObject<HTMLElement>) {
  const opener = useRef<HTMLElement | null>(null);
  return {
    remember: () => {
      opener.current = document.activeElement as HTMLElement | null;
    },
    onCloseAutoFocus: (event: Event) => {
      event.preventDefault();
      (override?.current ?? opener.current)?.focus();
    },
  };
}
