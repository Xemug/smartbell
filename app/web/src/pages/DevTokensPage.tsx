import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import {
  breakpoints,
  colors,
  cssColor,
  moonAliases,
  radii,
  shadows,
  sizes,
  space,
  tiers,
  typeRamp,
  typeStyles,
} from '../styles/designTokens';

// Internal preview of every design token, for checking against the UI Kit Foundations page.
// Everything is painted through the generated CSS variables, not the hex values.

const groups = [...new Set(colors.map((c) => c.group))];

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <h2 id={id} className="ramp-section-title">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Code({ children }: { children: ReactNode }) {
  return <code className="type-body-sm text-secondary-text">{children}</code>;
}

export function DevTokensPage() {
  const { t } = useTranslation();
  const sample = t('devTokens.sample');

  return (
    <main className="mx-auto flex max-w-container flex-col gap-12 p-4 md:p-6 lg:p-8">
      <header className="flex flex-col gap-2">
        <h1 className="ramp-page-title">{t('devTokens.title')}</h1>
        <p className="ramp-body text-secondary-text">{t('devTokens.intro')}</p>
        <p className="type-label-md">
          {t('devTokens.tier')}:{' '}
          <span data-testid="current-tier">
            <span className="md:hidden">sm</span>
            <span className="hidden md:inline lg:hidden">md</span>
            <span className="hidden lg:inline">lg</span>
          </span>
        </p>
      </header>

      <Section id="colors" title={t('devTokens.colors')}>
        {groups.map((group) => (
          <div key={group} className="flex flex-col gap-2">
            <h3 className="ramp-card-title capitalize">{group}</h3>
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
              {colors
                .filter((c) => c.group === group)
                .map((c) => (
                  <li
                    key={c.name}
                    data-testid={`color-${c.name}`}
                    className="flex items-center gap-3 rounded-surface bg-neutral-1 p-2 shadow-moon-sm"
                  >
                    <span
                      className="h-12 w-12 shrink-0 rounded-moon-i-sm border border-neutral-2"
                      style={{ background: cssColor(c.name) }}
                    />
                    <span className="flex min-w-0 flex-col">
                      <span className="type-label-md">{c.name}</span>
                      <Code>{c.value}</Code>
                      {c.figma && <Code>Figma: {c.figma}</Code>}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        ))}
        <div className="flex flex-col gap-2">
          <h3 className="ramp-card-title">{t('devTokens.moon')}</h3>
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
            {moonAliases.map((m) => (
              <li key={m.name} className="flex items-center gap-2">
                <span
                  className="h-8 w-8 shrink-0 rounded-full border border-neutral-2"
                  style={{ background: `rgb(var(--${m.name}))` }}
                />
                <span className="flex flex-col">
                  <span className="type-label-sm">{m.name}</span>
                  <Code>{m.color}</Code>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section id="type" title={t('devTokens.typography')}>
        <ul className="flex flex-col gap-3">
          {typeStyles.map((s) => (
            <li key={s.name} data-testid={`type-${s.name}`} className="flex flex-col">
              <Code>
                {s.name} · {s.figma} · {s.font} {s.fontWeight} {s.fontSize}/{s.lineHeight}
              </Code>
              <span className={`type-${s.name}`}>{sample}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="ramp" title={t('devTokens.ramp')}>
        <p className="ramp-caption text-secondary-text">{t('devTokens.rampIntro')}</p>
        <ul className="flex flex-col gap-4">
          {typeRamp.map((r) => (
            <li key={r.name} className="flex flex-col">
              <Code>
                ramp-{r.name} · {tiers.map((tier) => `${tier}: ${r.styles[tier]}`).join(' · ')}
              </Code>
              <span data-testid={`ramp-${r.name}`} className={`ramp-${r.name}`}>
                {sample}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="space" title={t('devTokens.spacing')}>
        <ul className="flex flex-col gap-2">
          {space.map((s) => (
            <li key={s.name} className="flex items-center gap-3">
              <span className="w-24 shrink-0">
                <Code>
                  {s.name} · {s.px}px
                </Code>
              </span>
              <span className="h-4 bg-primary" style={{ width: `var(--space-${s.name})` }} />
            </li>
          ))}
        </ul>
        <ul className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
          {sizes.map((s) => (
            <li key={s.name}>
              <Code>
                {s.name} · {s.px}px
              </Code>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="radius" title={t('devTokens.radii')}>
        <ul className="flex flex-wrap gap-4">
          {radii.map((r) => (
            <li key={r.name} className="flex flex-col items-center gap-1">
              <span
                className="h-16 w-16 border-2 border-primary bg-tertiary"
                style={{ borderRadius: `var(--radius-${r.name})` }}
              />
              <Code>
                {r.name} · {r.px}
              </Code>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="shadow" title={t('devTokens.shadows')}>
        <ul className="flex flex-wrap gap-6">
          {shadows.map((s) => (
            <li
              key={s.name}
              className="flex h-24 w-32 items-center justify-center rounded-surface bg-neutral-1"
              style={{ boxShadow: `var(--shadow-${s.name})` }}
            >
              <Code>{s.name}</Code>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="breakpoints" title={t('devTokens.breakpoints')}>
        <ul className="flex flex-col gap-1">
          {breakpoints.map((b) => (
            <li key={b.name}>
              <Code>
                {b.name} ≥ {b.px}px · {b.description}
              </Code>
            </li>
          ))}
        </ul>
      </Section>
    </main>
  );
}
