import type { ComponentType } from 'react';

import type { AnimalDetail } from '../animals/profile/api';
import type { EventKind } from './eventTypes';
import { HeatPrompt } from './heat/HeatPrompt';
import type { EventCreate } from './useRecordEvent';

/** What EventWizard hands each flow. The shell owns the surface, the guard and the save. */
export interface EventFlowProps {
  animal: AnimalDetail;
  /** Saves the event. On success the shell shows the snackbar, refreshes and closes. */
  record: (body: EventCreate) => void;
  /** True while the save is in flight. */
  recording: boolean;
  /** Tell the shell the user has entered something, so leaving asks first. */
  setDirty: (dirty: boolean) => void;
  /** Leave the flow (asks first when dirty), e.g. from a first step's Regresar. */
  cancel: () => void;
}

export interface EventFlow {
  /** The surface's title, an i18n key: "Registro de celo". */
  titleKey: string;
  Component: ComponentType<EventFlowProps>;
}

/**
 * One flow per event kind. Each event-flow card adds its own entry here; a kind without one shows
 * as "Disponible pronto" in the launcher.
 */
export const EVENT_FLOWS: Partial<Record<EventKind, EventFlow>> = {
  HEAT: { titleKey: 'events.titles.HEAT', Component: HeatPrompt },
};

export const hasFlow = (kind: EventKind) => Boolean(EVENT_FLOWS[kind]);
