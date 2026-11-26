import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Banner } from '../../../ui/Banner';
import { Button } from '../../../ui/Button';
import { ChipGroup } from '../../../ui/ChipGroup';
import { cx, focusRing } from '../../../ui/cx';
import { DataTable, type DataTableColumn } from '../../../ui/DataTable';
import { DateRangeField } from '../../../ui/DateRangeField';
import { toDisplay, todayIso } from '../../../ui/dates';
import { iconSliders } from '../../../ui/icons/glyphs';
import type { AnimalDetail, AnimalEvent } from './api';
import { EventDetailDialog } from './EventDetailDialog';
import { useEventText } from './eventText';
import {
  EVENT_CATEGORIES,
  categoryOf,
  filterEvents,
  NO_FILTER,
  type BitacoraFilter,
  type EventCategory,
} from './profileFacts';

interface BitacoraProps {
  animal: AnimalDetail;
  events: AnimalEvent[];
  filter: BitacoraFilter;
  onFilterChange: (filter: BitacoraFilter) => void;
}

/** The event log (mobile-core B4, event-flows 1.0): Tipo | Fecha | Evento, filterable. */
export function Bitacora({ animal, events, filter, onFilterChange }: BitacoraProps) {
  const { t } = useTranslation();
  const text = useEventText();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<BitacoraFilter>(filter);
  const [shown, setShown] = useState<AnimalEvent | null>(null);
  const rows = filterEvents(events, filter);
  const active = filter.categories.length + (filter.from ? 1 : 0);

  const columns: DataTableColumn<AnimalEvent>[] = [
    {
      key: 'tipo',
      header: t('profile.bitacora.columns.tipo'),
      cell: (event) => t(`profile.categories.${categoryOf(event)}`),
    },
    {
      key: 'fecha',
      header: t('profile.bitacora.columns.fecha'),
      sortValue: (event) => event.occurred_on,
      cell: (event) => toDisplay(event.occurred_on),
    },
    {
      key: 'evento',
      header: t('profile.bitacora.columns.evento'),
      cell: (event) => (
        <button
          type="button"
          onClick={() => setShown(event)}
          className={cx(
            'rounded-sm text-left text-primary underline-offset-2 hover:underline',
            focusRing,
          )}
        >
          {text(event)}
        </button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-secondary-text type-body-sm" aria-live="polite">
          {active > 0 ? t('profile.bitacora.filtered', { count: active }) : ''}
        </span>
        <div className="flex gap-2">
          {active > 0 && (
            <Button variant="ghost" size="sm" onClick={() => onFilterChange(NO_FILTER)}>
              {t('profile.bitacora.clear')}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            leadingIcon={iconSliders}
            aria-expanded={open}
            onClick={() => {
              setDraft(filter);
              setOpen((was) => !was);
            }}
          >
            {t('profile.bitacora.filter')}
          </Button>
        </div>
      </div>

      {open && (
        <div className="flex flex-col gap-3 rounded-moon-i-sm bg-secondary-background p-3">
          <p className="type-label-md">{t('profile.bitacora.filterTitle')}</p>
          <ChipGroup
            label={t('profile.bitacora.filterTitle')}
            layout="wrap"
            size="sm"
            options={EVENT_CATEGORIES.map((value) => ({
              value,
              label: t(`profile.categories.${value}`),
            }))}
            value={draft.categories}
            onChange={(value) => setDraft({ ...draft, categories: value as EventCategory[] })}
          />
          {/* Future dates can never be picked (mobile-core B4). */}
          <DateRangeField
            label={t('profile.bitacora.period')}
            value={draft.from && draft.to ? { from: draft.from, to: draft.to } : null}
            onChange={(range) =>
              setDraft({ ...draft, from: range?.from ?? null, to: range?.to ?? null })
            }
            maxDate={todayIso()}
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              disabled={draft.categories.length === 0 && !draft.from}
              onClick={() => {
                onFilterChange(draft);
                setOpen(false);
              }}
            >
              {t('profile.bitacora.apply')}
            </Button>
          </div>
        </div>
      )}

      <DataTable
        label={t('profile.bitacora.label')}
        columns={columns}
        rows={rows}
        getRowId={(event) => event.id}
        empty={<Banner tone="info">{t('profile.bitacora.empty')}</Banner>}
      />

      <EventDetailDialog animal={animal} event={shown} onClose={() => setShown(null)} />
    </div>
  );
}
