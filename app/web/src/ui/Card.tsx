import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { cx } from './cx';

type CardProps = Omit<ComponentPropsWithoutRef<'div'>, 'title'> & {
  title?: ReactNode;
  footer?: ReactNode;
  /** `flat` drops the shadow, for a card that sits on another surface. */
  variant?: 'raised' | 'flat';
};

export function Card({
  title,
  footer,
  variant = 'raised',
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      {...props}
      className={cx(
        'flex flex-col gap-3 rounded-moon-i-sm bg-neutral-1 p-4 text-primary-text',
        variant === 'raised' ? 'shadow-moon-sm' : 'border',
        className,
      )}
    >
      {title && <h3 className="ramp-card-title text-primary">{title}</h3>}
      {children}
      {footer && <div className="mt-auto flex flex-wrap justify-end gap-2 pt-1">{footer}</div>}
    </div>
  );
}
