import { useTranslation } from 'react-i18next';

import { Banner } from '../../../ui/Banner';
import { DataTable } from '../../../ui/DataTable';
import { toDisplay } from '../../../ui/dates';
import { Tabs } from '../../../ui/Tabs';
import type { AnimalDetail, AnimalEvent, CowMilk } from './api';
import { Bitacora } from './Bitacora';
import {
  dietHistory,
  weighings,
  type BitacoraFilter,
  type Diet,
  type Weighing,
} from './profileFacts';

export const RECORD_TABS = ['bitacora', 'produccion', 'peso', 'dieta'] as const;
export type RecordTab = (typeof RECORD_TABS)[number];

interface RecordsPanelProps {
  animal: AnimalDetail;
  events: AnimalEvent[];
  milk: CowMilk | undefined;
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
        getRowId={(row) => `${row.since}-${row.diet}`}
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

/** Registros (V 3850-10981 / 3850-10850, diet history V 4027-10314) plus the bitácora. */
export function RecordsPanel({
  animal,
  events,
  milk,
  milkVisible,
  tab,
  onTabChange,
  filter,
  onFilterChange,
}: RecordsPanelProps) {
  const { t } = useTranslation();
  return (
    <Tabs
      label={t('profile.records.tabs')}
      value={tab}
      onChange={(value) => onTabChange(value as RecordTab)}
      items={[
        {
          value: 'bitacora',
          label: t('profile.records.bitacora'),
          content: (
            <Bitacora
              animal={animal}
              events={events}
              filter={filter}
              onFilterChange={onFilterChange}
            />
          ),
        },
        // Litres are a cow's; a bull or steer has none to show.
        ...(animal.sex === 'MACHO'
          ? []
          : [
              {
                value: 'produccion',
                label: t('profile.records.produccion'),
                content: <Production milk={milk} visible={milkVisible} />,
              },
            ]),
        {
          value: 'peso',
          label: t('profile.records.peso'),
          content: <Weights animal={animal} events={events} />,
        },
        { value: 'dieta', label: t('profile.cards.dieta'), content: <Diets events={events} /> },
      ]}
    />
  );
}
