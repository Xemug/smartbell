import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { useIsDesktop } from '../../app/useIsDesktop';
import { iconDiscCalving, iconDiscDim, iconDiscHeat, iconDiscSick } from '../../ui/icons/glyphs';
import { Icon } from '../../ui/icons/Icon';
import { Illustration } from '../../ui/icons/Illustration';

const valueProps = [
  { key: 'heat', icon: iconDiscHeat },
  { key: 'calving', icon: iconDiscCalving },
  { key: 'sick', icon: iconDiscSick },
  { key: 'dim', icon: iconDiscDim },
] as const;

/** Mobile: the V4 single column. Web (≥960): W 1-146, the value props beside the form. */
export function AuthLayout({ title, children }: { title: string; children: ReactNode }) {
  const { t } = useTranslation();
  const isDesktop = useIsDesktop();
  const form = (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-8">
      <Illustration name="logo" alt="" className="mx-auto h-16" />
      <h1 className="sr-only">{title}</h1>
      {children}
    </main>
  );
  if (!isDesktop) return <div className="min-h-dvh bg-neutral-1">{form}</div>;
  return (
    <div className="flex min-h-dvh flex-col bg-neutral-1">
      <header className="bg-primary px-4 py-3 text-center text-button-text type-heading-sm">
        {t('auth.welcomeBanner')}
      </header>
      <div className="grid flex-1 grid-cols-2">
        <section
          aria-label={t('auth.valueTitle')}
          className="flex flex-col justify-center gap-6 bg-secondary px-16 text-button-text"
        >
          <p className="max-w-md border-b border-neutral-1/60 pb-2 type-heading-md">
            {t('auth.valueTitle')}
          </p>
          <ul className="flex flex-col gap-6">
            {valueProps.map(({ key, icon }) => (
              <li key={key} className="flex max-w-md items-center gap-4 type-body-md">
                <Icon icon={icon} size={64} className="shrink-0" />
                {t(`auth.value.${key}`)}
              </li>
            ))}
          </ul>
        </section>
        <div className="flex items-center justify-center">{form}</div>
      </div>
    </div>
  );
}
