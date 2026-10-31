import { useRef } from 'react';

// Radix returns focus only to its own Trigger. Ours are controlled from any button, so without this
// closing a dialog would drop a keyboard user at the top of the page.
export function useReturnFocus() {
  const opener = useRef<HTMLElement | null>(null);
  return {
    remember: () => {
      opener.current = document.activeElement as HTMLElement | null;
    },
    onCloseAutoFocus: (event: Event) => {
      event.preventDefault();
      opener.current?.focus();
    },
  };
}
