import { createContext, useContext } from 'react';

import type { Glyph } from './icons/glyphs';
import type { SnackbarKind } from './Snackbar';

export interface SnackbarOptions {
  kind?: SnackbarKind;
  message: string;
  icon?: Glyph;
  /** Milliseconds on screen. Defaults to 5 s, or 8 s for errors. */
  duration?: number;
}

export interface SnackbarApi {
  /** Shows a snackbar and returns its id. */
  show: (options: SnackbarOptions) => number;
  dismiss: (id: number) => void;
}

export const SnackbarContext = createContext<SnackbarApi | null>(null);

export function useSnackbar(): SnackbarApi {
  const api = useContext(SnackbarContext);
  if (!api) throw new Error('useSnackbar needs a SnackbarProvider above it');
  return api;
}
