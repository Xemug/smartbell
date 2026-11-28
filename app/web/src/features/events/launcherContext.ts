import { createContext, useContext } from 'react';

import type { AnimalDetail } from '../animals/profile/api';
import type { EventKind, LauncherGroup } from './eventTypes';

export interface EventLauncherApi {
  /** The launcher for one profile card: its entries, enabled or with the reason they are not. */
  openLauncher: (animal: AnimalDetail, group: LauncherGroup) => void;
  /**
   * Straight into one event's form, e.g. from an automatic task. Resolves true once the event is
   * recorded (the task then closes itself) and false if the user backed out. With a `taskId` the
   * snackbar names the animal, as there is no profile behind it.
   */
  openEvent: (animalId: string, kind: EventKind, taskId?: string) => Promise<boolean>;
}

export const EventLauncherContext = createContext<EventLauncherApi | null>(null);

export function useEventLauncher(): EventLauncherApi {
  const api = useContext(EventLauncherContext);
  if (!api) throw new Error('useEventLauncher needs an EventLauncherProvider above it');
  return api;
}
