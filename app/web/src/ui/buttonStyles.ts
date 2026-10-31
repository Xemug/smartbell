import { cx, focusRing } from './cx';

export type ButtonVariant = 'fill' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const variants: Record<ButtonVariant, string> = {
  fill: 'bg-primary text-button-text hover:bg-primary/90 active:bg-primary-dark disabled:bg-neutral-2 disabled:text-secondary-text',
  outline:
    'border border-neutral-2 bg-neutral-1 text-primary-text hover:bg-secondary-background active:bg-neutral-2 disabled:text-secondary-text',
  ghost:
    'text-primary hover:bg-primary-10 active:bg-secondary-background disabled:text-secondary-text',
  // The kit draws no danger button; uikit-design-system.md §6.3 asks for one.
  danger:
    'bg-error text-button-text hover:bg-error/90 active:bg-error/80 disabled:bg-neutral-2 disabled:text-secondary-text',
};

export function buttonClass(variant: ButtonVariant, circle = false): string {
  return cx(
    'inline-flex shrink-0 items-center justify-center transition-colors disabled:cursor-not-allowed',
    circle ? 'rounded-full' : 'rounded-interactive',
    focusRing,
    variants[variant],
  );
}

export const iconSizes: Record<ButtonSize, number> = { xs: 14, sm: 16, md: 20, lg: 24, xl: 24 };
