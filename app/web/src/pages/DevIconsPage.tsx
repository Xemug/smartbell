import { useTranslation } from 'react-i18next';

import { Icon } from '../ui/icons/Icon';
import { iconNames, icons, illustrationNames } from '../ui/icons/index';
import { Illustration } from '../ui/icons/Illustration';

// Internal preview of every exported icon and illustration.

const lineIcons = iconNames.filter((name) => icons[name].kind === 'line');
const colorIcons = iconNames.filter((name) => icons[name].kind === 'color');

export function DevIconsPage() {
  const { t } = useTranslation();

  return (
    <main className="mx-auto flex max-w-container flex-col gap-12 p-4 md:p-6 lg:p-8">
      <header className="flex flex-col gap-2">
        <h1 className="ramp-page-title">{t('devIcons.title')}</h1>
        <p className="ramp-body text-secondary-text">{t('devIcons.intro')}</p>
      </header>

      {/* The swatches sit under a coloured parent to show line icons follow the text colour. */}
      <section aria-labelledby="line-icons" className="flex flex-col gap-4">
        <h2 id="line-icons" className="ramp-section-title">
          {t('devIcons.line')}
        </h2>
        {['text-primary-text', 'text-heat'].map((color) => (
          <ul
            key={color}
            data-testid={`line-${color}`}
            className={`grid grid-cols-3 gap-4 md:grid-cols-6 lg:grid-cols-8 ${color}`}
          >
            {lineIcons.map((name) => (
              <li key={name} className="flex flex-col items-center gap-1 text-center">
                <Icon name={name} data-testid={`icon-${name}`} />
                <span className="type-body-sm break-all">{name}</span>
              </li>
            ))}
          </ul>
        ))}
      </section>

      <section aria-labelledby="color-icons" className="flex flex-col gap-4">
        <h2 id="color-icons" className="ramp-section-title">
          {t('devIcons.color')}
        </h2>
        <ul className="grid grid-cols-3 gap-4 md:grid-cols-6 lg:grid-cols-8">
          {colorIcons.map((name) => (
            <li key={name} className="flex flex-col items-center gap-1 text-center">
              <Icon name={name} size={60} data-testid={`icon-${name}`} />
              <span className="type-body-sm break-all">{name}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="illustrations" className="flex flex-col gap-4">
        <h2 id="illustrations" className="ramp-section-title">
          {t('devIcons.illustrations')}
        </h2>
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {illustrationNames.map((name) => (
            <li
              key={name}
              className={`flex flex-col items-center gap-1 rounded-moon-i-sm p-2 text-center ${
                name === 'logo-white' ? 'bg-primary-dark' : ''
              }`}
            >
              <Illustration name={name} alt={name} className="h-32 max-w-full" />
              <span className={`type-body-sm ${name === 'logo-white' ? 'text-gohan' : ''}`}>
                {name}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
