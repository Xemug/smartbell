import { useSyncExternalStore } from 'react';

import { breakpointPx } from '../styles/designTokens';

const query = `(min-width: ${breakpointPx('lg')}px)`;

function subscribe(onChange: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

/** True from the web layout up, so only one shell mounts and each one owns its own landmarks. */
export function useIsDesktop(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches);
}
