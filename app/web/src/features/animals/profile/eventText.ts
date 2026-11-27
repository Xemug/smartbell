import { useTranslation } from 'react-i18next';

import type { AnimalEvent } from './api';
import { eventLabel } from './profileFacts';

/** The Evento column's words for an event, in the user's language. */
export function useEventText(): (event: AnimalEvent) => string {
  const { t } = useTranslation();
  return (event) => {
    const { key, params = {} } = eventLabel(event);
    const named = { ...params };
    if (named.illness) named.illness = t(`profile.illnesses.${named.illness}`);
    if (named.reason) named.reason = t(`profile.baja.reasons.${named.reason}`);
    return t(`profile.events.${key}`, named);
  };
}
