import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { Snackbar } from './Snackbar';
import { snackbarLayer } from './useReturnFocus';
import { SnackbarContext, type SnackbarApi, type SnackbarOptions } from './useSnackbar';

const maxVisible = 3;

type Item = SnackbarOptions & { id: number };

function Entry({ item, dismiss }: { item: Item; dismiss: SnackbarApi['dismiss'] }) {
  const { id, kind, message, icon, duration } = item;
  // Stable, or every new snackbar would restart the older ones' timers.
  const close = useCallback(() => dismiss(id), [dismiss, id]);
  return (
    <Snackbar
      kind={kind}
      message={message}
      icon={icon}
      duration={duration ?? (kind === 'error' ? 8000 : 5000)}
      onClose={close}
      className="pointer-events-auto"
    />
  );
}

// Bottom-centre, as in W 3807-170164. New ones stack, so two quick saves both get confirmed.
export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback<SnackbarApi['dismiss']>(
    (id) => setItems((current) => current.filter((item) => item.id !== id)),
    [],
  );
  const show = useCallback<SnackbarApi['show']>((options) => {
    const id = nextId.current++;
    setItems((current) => [...current, { ...options, id }].slice(-maxVisible));
    return id;
  }, []);
  const api = useMemo(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <SnackbarContext.Provider value={api}>
      {children}
      {createPortal(
        // Always mounted and aria-live, so a message is announced, even with a dialog open (dialogs
        // hide the rest of the page from screen readers, except live regions). Sits above dialogs,
        // whose layer turns off pointer events on the body.
        <div
          aria-live="polite"
          {...{ [snackbarLayer]: '' }}
          className="pointer-events-none fixed inset-x-4 bottom-[calc(max(1rem,env(safe-area-inset-bottom))+var(--snackbar-lift,0px))] z-50 flex flex-col items-center gap-2"
        >
          {items.map((item) => (
            <Entry key={item.id} item={item} dismiss={dismiss} />
          ))}
        </div>,
        document.body,
      )}
    </SnackbarContext.Provider>
  );
}
