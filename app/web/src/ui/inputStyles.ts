import { cx } from './cx';

export type InputSize = 'sm' | 'md' | 'lg' | 'xl';

export const inputSizes: Record<InputSize, string> = {
  sm: 'h-control-sm',
  md: 'h-control-md',
  lg: 'h-control-lg',
  xl: 'h-control-xl',
};

// The box around an input, select or date field. Body stays 16: the kit's 14 is too small in the
// field (reconciliation §4.8) and iOS zooms the page into any smaller input.
export function fieldBox(error: boolean | undefined, disabled: boolean | undefined): string {
  return cx(
    'flex w-full items-center gap-2 rounded-moon-i-sm border bg-neutral-1 px-3 type-body-lg transition-colors',
    error ? 'border-error' : 'border-neutral-2',
    disabled
      ? 'cursor-not-allowed bg-secondary-background text-secondary-text'
      : !error && 'hover:border-neutral-3',
    'focus-within:ring-2 focus-within:ring-primary',
  );
}
