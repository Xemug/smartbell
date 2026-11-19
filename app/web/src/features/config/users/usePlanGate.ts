import { usePlan } from './api';

/**
 * The one "has Pro" check for Administrar usuarios. Inviting is a Pro feature (plans-billing);
 * `hasPro` is undefined while the answer loads, so nothing flashes the upsell or the button.
 */
export function usePlanGate(): { hasPro: boolean | undefined } {
  const plan = usePlan();
  return { hasPro: plan.data?.has_pro };
}
