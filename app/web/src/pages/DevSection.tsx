import type { ReactNode } from 'react';

export function DevSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <h2 id={id} className="ramp-section-title">
        {title}
      </h2>
      {children}
    </section>
  );
}
