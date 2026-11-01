import type { ReactNode } from 'react';

import { cx } from './cx';
import { Illustration } from './icons/Illustration';
import type { IllustrationName } from './icons/index';

interface EmptyStateProps {
  title: string;
  description?: string;
  /** One of the mascots. */
  illustration?: IllustrationName;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  illustration = 'cow-sad',
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cx('flex flex-col items-center gap-3 p-6 text-center', className)}>
      <Illustration name={illustration} alt="" className="h-32 w-auto" />
      <p className="ramp-card-title text-primary">{title}</p>
      {description && <p className="type-body-md text-secondary-text">{description}</p>}
      {action}
    </div>
  );
}
