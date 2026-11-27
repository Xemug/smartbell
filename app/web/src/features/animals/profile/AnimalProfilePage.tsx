import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { useActiveRanch } from '../../../app/useActiveRanch';
import { useIsDesktop } from '../../../app/useIsDesktop';
import { Banner } from '../../../ui/Banner';
import { Button } from '../../../ui/Button';
import { cx, focusRing } from '../../../ui/cx';
import { iconArrowLeft, iconBull, iconCow, iconHeifer, type Glyph } from '../../../ui/icons/glyphs';
import { Icon } from '../../../ui/icons/Icon';
import { Spinner } from '../../../ui/Spinner';
import { ANIMALS_PATH } from '../list/AnimalListPage';
import { ApiError } from '../list/api';
import {
  useAnimal,
  useAnimalEvents,
  useBullServices,
  useCowMilk,
  useForgetAnimal,
  type AnimalDetail,
} from './api';
import {
  EVENT_CATEGORIES,
  longDate,
  profileBanners,
  recordTabs,
  type BitacoraFilter,
  type RecordTab,
  type EventCategory,
} from './profileFacts';
import { ProfileSummary } from './ProfileSummary';
import { RecordsPanel } from './RecordsPanel';
import { RemoveAnimalFlow } from './RemoveAnimalFlow';

export const PROFILE_ROUTE = `${ANIMALS_PATH}/:id`;
export const RECORDS_ROUTE = `${ANIMALS_PATH}/:id/registros`;

const KIND_ICONS: Record<AnimalDetail['kind'], Glyph> = {
  VACA: iconCow,
  VAQUILLA: iconHeifer,
  TORO: iconBull,
  BECERRO: iconHeifer,
  NOVILLO: iconBull,
};

/** The list each kind lives in, for the back arrow and after a Baja. Calves and steers have
 * no list of their own yet, so they go to the default one. */
const listOf = (animal: AnimalDetail | undefined) =>
  animal?.kind === 'TORO'
    ? `${ANIMALS_PATH}?tipo=toros`
    : animal?.kind === 'VAQUILLA'
      ? `${ANIMALS_PATH}?tipo=vaquillas`
      : ANIMALS_PATH;

/** `?tipo=salud,dieta&desde=…&hasta=…`: the bitácora filter, kept in the address. */
function readFilter(params: URLSearchParams): BitacoraFilter {
  const categories = (params.get('tipo') ?? '')
    .split(',')
    .filter((value): value is EventCategory =>
      (EVENT_CATEGORIES as readonly string[]).includes(value),
    );
  const iso = (value: string | null) => (value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null);
  const from = iso(params.get('desde'));
  const to = iso(params.get('hasta'));
  return { categories, from: from && to ? from : null, to: from && to ? to : null };
}

function filterParams(filter: BitacoraFilter, tab: RecordTab): URLSearchParams {
  const params = new URLSearchParams();
  if (tab !== 'bitacora') params.set('tab', tab);
  if (filter.categories.length) params.set('tipo', filter.categories.join(','));
  if (filter.from && filter.to) {
    params.set('desde', filter.from);
    params.set('hasta', filter.to);
  }
  return params;
}

/**
 * The animal profile (V4 MVP, V 4000-10263) with its Registros. A phone shows one at a time
 * (`/vacas/:id` and `/vacas/:id/registros`); the web layout shows both side by side.
 */
export function AnimalProfilePage({ records = false }: { records?: boolean }) {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const desktop = useIsDesktop();
  const { can } = useActiveRanch();
  const [params, setParams] = useSearchParams();
  const today = useMemo(() => new Date(), []);
  const [removing, setRemoving] = useState(false);
  const forgetAnimal = useForgetAnimal();

  const animalQuery = useAnimal(id);
  const eventsQuery = useAnimalEvents(id);
  const animal = animalQuery.data;
  const milkVisible = can('REPORTS_VIEW');
  const milkQuery = useCowMilk(id, milkVisible && animal?.sex === 'HEMBRA');
  const servicesQuery = useBullServices(id, animal?.sex === 'MACHO');
  const dam = useAnimal(animal?.dam_id ?? undefined);
  const sire = useAnimal(animal?.sire_id ?? undefined);

  const tabParam = params.get('tab');
  // A tab this animal lacks (a bull's Producción, a cow's Servicios) falls back to its first.
  const tabs: RecordTab[] = animal ? recordTabs(animal) : ['bitacora'];
  const tab: RecordTab = tabs.find((value) => value === tabParam) ?? tabs[0] ?? 'bitacora';
  const filter = readFilter(params);
  const profileHref = `${ANIMALS_PATH}/${id}`;
  const recordsHref = (target: { tab?: string; tipo?: EventCategory }) => {
    const next = filterParams(
      { categories: target.tipo ? [target.tipo] : [], from: null, to: null },
      (target.tab as RecordTab | undefined) ?? 'bitacora',
    );
    const query = next.toString();
    return `${desktop ? profileHref : `${profileHref}/registros`}${query ? `?${query}` : ''}`;
  };

  if (animalQuery.isPending) {
    return (
      <div className="flex justify-center p-8">
        <Spinner size={32} />
      </div>
    );
  }
  if (!animal) {
    const missing =
      animalQuery.error instanceof ApiError && animalQuery.error.code === 'animal_not_found';
    return (
      <div className="flex flex-col items-start gap-3 p-4">
        <Banner tone={missing ? 'info' : 'error'}>
          {missing ? t('profile.notFound') : t('profile.loadError')}
        </Banner>
        {missing ? (
          <Link to={ANIMALS_PATH} className={cx('text-primary underline', focusRing)}>
            {t('profile.toList')}
          </Link>
        ) : (
          <Button variant="outline" onClick={() => void animalQuery.refetch()}>
            {t('animals.retry')}
          </Button>
        )}
      </div>
    );
  }

  const events = eventsQuery.data ?? [];
  const kind = t(`profile.kinds.${animal.kind}`);
  const showRecords = desktop || records;
  const showSummary = desktop || !records;
  const backHref = records && !desktop ? profileHref : listOf(animal);
  const active = animal.status === 'ACTIVE';

  const banners = profileBanners(animal, today).map((banner) => {
    const values: Record<string, string | number> = { ...banner.params };
    if (banner.key === 'sick' || banner.key === 'sickToday')
      values.noun = t(`profile.kinds.${animal.kind}`).toLowerCase();
    if (banner.key === 'removed') {
      values.reason = animal.removed_reason
        ? t(`profile.baja.reasons.${animal.removed_reason}`).toLowerCase()
        : '';
      values.date = animal.removed_at ? longDate(animal.removed_at) : '';
    }
    return { ...banner, text: t(`profile.banners.${banner.key}`, values) };
  });

  return (
    <div className="mx-auto flex w-full max-w-screen-xl flex-col gap-4 p-4">
      <header className="flex items-center gap-3">
        <Link
          to={backHref}
          aria-label={records && !desktop ? t('profile.records.toProfile') : t('profile.back')}
          className={cx('rounded-full p-1 text-primary', focusRing)}
        >
          <Icon icon={iconArrowLeft} size={28} />
        </Link>
        <h1 className="flex items-center gap-2 type-title-md">
          <Icon icon={KIND_ICONS[animal.kind]} size={32} className="text-primary" />
          {records && !desktop
            ? t('profile.records.title', { kind, id: animal.control_id })
            : t('profile.title', { kind, id: animal.control_id })}
        </h1>
      </header>

      {banners.length > 0 && (
        <div className="flex flex-col gap-2" data-testid="profile-banners">
          {banners.map((banner) => (
            <Banner key={banner.key} tone={banner.tone}>
              {banner.text}
            </Banner>
          ))}
        </div>
      )}

      <div className={cx('grid gap-6', desktop && 'grid-cols-[minmax(0,400px)_minmax(0,1fr)]')}>
        {showSummary && (
          <ProfileSummary
            animal={animal}
            events={events}
            avgLiters={
              milkQuery.data?.avg_daily_liters == null
                ? null
                : Number(milkQuery.data.avg_daily_liters)
            }
            today={today}
            recordsHref={recordsHref}
            services={servicesQuery.data}
            parents={{ dam: dam.data?.control_id, sire: sire.data?.control_id }}
            onRemove={active && can('ANIMALS_DELETE') ? () => setRemoving(true) : null}
            registrosHref={desktop ? null : `${profileHref}/registros`}
          />
        )}
        {showRecords && (
          <section aria-label={t('profile.registros')} className="flex min-w-0 flex-col gap-3">
            {desktop && <h2 className="type-title-sm">{t('profile.registros')}</h2>}
            {eventsQuery.isError ? (
              <Banner tone="error">{t('profile.bitacora.loadError')}</Banner>
            ) : (
              <RecordsPanel
                animal={animal}
                events={events}
                milk={milkQuery.data}
                services={servicesQuery.data}
                servicesFailed={servicesQuery.isError}
                milkVisible={milkVisible}
                tab={tab}
                onTabChange={(next) => setParams(filterParams(filter, next), { replace: true })}
                filter={filter}
                onFilterChange={(next) => setParams(filterParams(next, tab), { replace: true })}
              />
            )}
          </section>
        )}
      </div>

      <RemoveAnimalFlow
        animal={animal}
        open={removing}
        onClose={() => setRemoving(false)}
        onDeleted={() => {
          navigate(listOf(animal), { replace: true });
          forgetAnimal(animal.id);
        }}
      />
    </div>
  );
}
