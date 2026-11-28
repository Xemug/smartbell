import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import { useIsDesktop } from '../../app/useIsDesktop';
import { BottomSheet } from '../../ui/BottomSheet';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
import type { AnimalDetail } from '../animals/profile/api';
import { EVENT_ICONS, launcherEntries, type EventKind, type LauncherGroup } from './eventTypes';
import { EventWizard } from './EventWizard';
import { hasFlow } from './flows';
import { EventLauncherContext, type EventLauncherApi } from './launcherContext';

interface EventLauncherProps {
  animal: AnimalDetail;
  group: LauncherGroup;
  onPick: (kind: EventKind) => void;
  onClose: () => void;
}

/** The entries of one profile card (event-flows 1.0): a sheet on phones, a modal on the web. */
export function EventLauncher({ animal, group, onPick, onClose }: EventLauncherProps) {
  const { t } = useTranslation();
  const desktop = useIsDesktop();
  const today = useMemo(() => new Date(), []);
  const entries = launcherEntries(animal, group, today, hasFlow);
  const title = t(`events.launcher.${group}`, {
    kind: t(`profile.kinds.${animal.kind}`),
    id: animal.control_id,
  });

  const list = (
    <ul className="flex flex-col gap-3">
      {entries.map(({ kind, reason }) => {
        const reasonId = `launcher-reason-${kind}`;
        return (
          <li key={kind} className="flex flex-col gap-1">
            <Button
              variant="outline"
              size="lg"
              fullWidth
              leadingIcon={EVENT_ICONS[kind]}
              disabled={reason !== null}
              aria-describedby={reason ? reasonId : undefined}
              onClick={() => onPick(kind)}
            >
              {t(`events.kinds.${kind}`)}
            </Button>
            {reason && (
              <p id={reasonId} className="px-1 text-secondary-text type-body-sm">
                {t(`events.reasons.${reason.key}`, reason.params)}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );

  const onOpenChange = (open: boolean) => {
    if (!open) onClose();
  };
  return desktop ? (
    <Modal open onOpenChange={onOpenChange} title={title}>
      {list}
    </Modal>
  ) : (
    <BottomSheet open onOpenChange={onOpenChange} title={title}>
      {list}
    </BottomSheet>
  );
}

type State =
  | { mode: 'launcher'; animal: AnimalDetail; group: LauncherGroup }
  | { mode: 'event'; animalId: string; kind: EventKind; fromTask: boolean };

/**
 * Holds the one launcher or event form that can be open, so a profile card and a task open the
 * same thing. Lives in the app shell; changing page closes it.
 */
export function EventLauncherProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State | null>(null);
  const settle = useRef<((recorded: boolean) => void) | null>(null);

  const finish = useCallback((recorded: boolean) => {
    settle.current?.(recorded);
    settle.current = null;
    setState(null);
  }, []);

  const api = useMemo<EventLauncherApi>(
    () => ({
      openLauncher: (animal, group) => {
        settle.current?.(false);
        settle.current = null;
        setState({ mode: 'launcher', animal, group });
      },
      openEvent: (animalId, kind, taskId) =>
        new Promise<boolean>((resolve) => {
          settle.current?.(false);
          settle.current = resolve;
          setState({ mode: 'event', animalId, kind, fromTask: Boolean(taskId) });
        }),
    }),
    [],
  );

  // The forms float over whatever page opened them; a new page is a new context.
  const { pathname } = useLocation();
  const shownOn = useRef(pathname);
  useEffect(() => {
    if (shownOn.current !== pathname) {
      shownOn.current = pathname;
      finish(false);
    }
  }, [pathname, finish]);

  return (
    <EventLauncherContext.Provider value={api}>
      {children}
      {state?.mode === 'launcher' && (
        <EventLauncher
          animal={state.animal}
          group={state.group}
          onClose={() => finish(false)}
          onPick={(kind) =>
            setState({ mode: 'event', animalId: state.animal.id, kind, fromTask: false })
          }
        />
      )}
      {state?.mode === 'event' && (
        <EventWizard
          key={`${state.animalId}-${state.kind}`}
          animalId={state.animalId}
          kind={state.kind}
          fromTask={state.fromTask}
          onClose={finish}
        />
      )}
    </EventLauncherContext.Provider>
  );
}
