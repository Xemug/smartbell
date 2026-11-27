import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { Banner } from '../../../ui/Banner';
import { cx, focusRing } from '../../../ui/cx';
import { DataTable } from '../../../ui/DataTable';
import { toDisplay } from '../../../ui/dates';
import { Tabs } from '../../../ui/Tabs';
import { ANIMALS_PATH } from '../list/AnimalListPage';
import type { AnimalDetail, AnimalEvent, BullService, CowMilk } from './api';
import { Bitacora } from './Bitacora';
import {
  dietHistory,
  weighings,
  type BitacoraFilter,
  type Diet,
  recordTabs,
  type RecordTab,
  type Weighing,
} from './profileFacts';

interface RecordsPanelProps {
  animal: AnimalDetail;
  events: AnimalEvent[];
  milk: CowMilk | undefined;
  /** A bull's services; undefined while loading or for a cow. */
  services: BullService[] | undefined;
  servicesFailed: boolean;
  /** False when the user may not see litres (no REPORTS_VIEW). */
  milkVisible: boolean;
  tab: RecordTab;
  onTabChange: (tab: RecordTab) => void;
  filter: BitacoraFilter;
  onFilterChange: (filter: BitacoraFilter) => void;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col rounded-moon-i-xs bg-neutral-1 p-3 shadow-moon-sm">
      <span className="text-secondary-text type-label-sm">{label}</span>
      <span className="type-title-sm">{value}</span>
    </div>
  );
}

function Production({ milk, visible }: { milk: CowMilk | undefined; visible: boolean }) {
  const { t } = useTranslation();
  if (!visible) return <Banner tone="info">{t('profile.production.noAccess')}</Banner>;
  if (!milk || milk.days_logged === 0)
    return <Banner tone="info">{t('profile.production.empty')}</Banner>;
  const litres = (value: number | string) =>
    t('profile.production.litres', { liters: Math.round(Number(value) * 10) / 10 });
  return (
    <div className="grid grid-cols-2 gap-3">
      <Stat
        label={t('profile.production.avg')}
        value={milk.avg_daily_liters == null ? t('animals.none') : litres(milk.avg_daily_liters)}
      />
      <Stat label={t('profile.production.total')} value={litres(milk.total_liters)} />
      <Stat label={t('profile.production.days')} value={String(milk.days_logged)} />
      <Stat
        label={t('profile.production.peak')}
        value={
          milk.peak
            ? t('profile.production.peakValue', {
                liters: Math.round(Number(milk.peak.liters) * 10) / 10,
                dim: milk.peak.dim ?? t('animals.none'),
              })
            : t('animals.none')
        }
      />
    </div>
  );
}

function Weights({ animal, events }: { animal: AnimalDetail; events: AnimalEvent[] }) {
  const { t } = useTranslation();
  const kg = (value: number | null) =>
    value == null ? t('animals.none') : t('profile.tiles.kg', { kg: value });
  const rows = weighings(events);
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        <Stat label={t('profile.weight.atBirth')} value={kg(animal.weight_birth_kg)} />
        <Stat label={t('profile.weight.atWeaning')} value={kg(animal.weight_weaning_kg)} />
        <Stat label={t('profile.weight.atYear')} value={kg(animal.weight_one_year_kg)} />
      </div>
      <DataTable<Weighing>
        label={t('profile.records.peso')}
        rows={rows}
        getRowId={(row) => row.event?.id ?? row.on}
        columns={[
          { key: 'peso', header: t('profile.weight.columns.peso'), cell: (row) => kg(row.kg) },
          {
            key: 'fecha',
            header: t('profile.weight.columns.fecha'),
            cell: (row) => toDisplay(row.on),
          },
        ]}
        empty={<Banner tone="info">{t('profile.weight.empty')}</Banner>}
      />
    </div>
  );
}

function Diets({ events }: { events: AnimalEvent[] }) {
  const { t } = useTranslation();
  const rows = dietHistory(events);
  const dash = t('animals.none');
  const money = (value: number | null) => (value == null ? dash : `$${value.toFixed(2)}`);
  const kg = (value: number | null) => (value == null ? dash : `${value}kg`);
  const latest = rows[0];
  return (
    <div className="flex flex-col gap-3">
      {latest && (
        <section className="flex flex-col gap-2 rounded-moon-i-sm bg-neutral-1 p-4 shadow-moon-sm">
          <h3 className="text-primary type-title-sm">{t('profile.diet.latest')}</h3>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 type-body-md">
            <dt className="text-secondary-text">{t('profile.diet.tipo')}</dt>
            <dd>{latest.dietType ?? latest.diet}</dd>
            <dt className="text-secondary-text">{t('profile.diet.inicio')}</dt>
            <dd>{toDisplay(latest.since)}</dd>
            <dt className="text-secondary-text">{t('profile.diet.costo')}</dt>
            <dd>{money(latest.dailyCost)}</dd>
            <dt className="text-secondary-text">{t('profile.diet.cantidad')}</dt>
            <dd>{kg(latest.dailyKg)}</dd>
          </dl>
        </section>
      )}
      <DataTable<Diet>
        label={t('profile.diet.title')}
        rows={rows}
        getRowId={(row) => row.eventId}
        columns={[
          {
            key: 'tipo',
            header: t('profile.diet.columns.tipo'),
            cell: (row) => row.dietType ?? row.diet,
          },
          { key: 'kg', header: t('profile.diet.columns.kg'), cell: (row) => kg(row.dailyKg) },
          {
            key: 'costo',
            header: t('profile.diet.columns.costo'),
            cell: (row) => money(row.dailyCost),
          },
          {
            key: 'fecha',
            header: t('profile.diet.columns.fecha'),
            cell: (row) => toDisplay(row.since),
          },
        ]}
        empty={<Banner tone="info">{t('profile.diet.empty')}</Banner>}
      />
    </div>
  );
}

function Services({ services, failed }: { services: BullService[] | undefined; failed: boolean }) {
  const { t } = useTranslation();
  if (failed) return <Banner tone="error">{t('profile.services.loadError')}</Banner>;
  return (
    <DataTable<BullService>
      label={t('profile.services.title')}
      rows={services ?? []}
      getRowId={(row) => row.event_id}
      columns={[
        {
          key: 'vaca',
          header: t('profile.services.columns.vaca'),
          cell: (row) => (
            <Link
              to={`${ANIMALS_PATH}/${row.cow_id}`}
              className={cx('text-primary underline', focusRing)}
            >
              {row.cow_control_id}
            </Link>
          ),
        },
        {
          key: 'metodo',
          header: t('profile.services.columns.metodo'),
          cell: (row) => t(`profile.services.methods.${row.method}`),
        },
        {
          key: 'fecha',
          header: t('profile.services.columns.fecha'),
          cell: (row) => toDisplay(row.occurred_on),
        },
      ]}
      empty={<Banner tone="info">{t('profile.services.empty')}</Banner>}
    />
  );
}

/** Registros (V 3850-10981 / 3850-10850, diet history V 4027-10314) plus the bitácora. */
export function RecordsPanel({
  animal,
  events,
  milk,
  services,
  servicesFailed,
  milkVisible,
  tab,
  onTabChange,
  filter,
  onFilterChange,
}: RecordsPanelProps) {
  const { t } = useTranslation();
  const contents: Record<RecordTab, { label: string; content: ReactNode }> = {
    bitacora: {
      label: t('profile.records.bitacora'),
      content: (
        <Bitacora animal={animal} events={events} filter={filter} onFilterChange={onFilterChange} />
      ),
    },
    produccion: {
      label: t('profile.records.produccion'),
      content: <Production milk={milk} visible={milkVisible} />,
    },
    servicios: {
      label: t('profile.records.servicios'),
      content: <Services services={services} failed={servicesFailed} />,
    },
    peso: {
      label: t('profile.records.peso'),
      content: <Weights animal={animal} events={events} />,
    },
    dieta: { label: t('profile.cards.dieta'), content: <Diets events={events} /> },
  };
  return (
    <Tabs
      label={t('profile.records.tabs')}
      value={tab}
      onChange={(value) => onTabChange(value as RecordTab)}
      items={recordTabs(animal).map((value) => ({ value, ...contents[value] }))}
    />
  );
}
