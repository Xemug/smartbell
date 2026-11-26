import { differenceInMonths, parseISO } from 'date-fns';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useParams } from 'react-router-dom';

import { Banner } from '../../ui/Banner';
import { Card } from '../../ui/Card';
import { cx, focusRing } from '../../ui/cx';
import { DataTable, type DataTableColumn } from '../../ui/DataTable';
import { SplitIndicator } from '../../ui/SplitIndicator';
import { ANIMALS_PATH } from '../animals/list/AnimalListPage';
import { useHeiferGroups, type HeiferGroup } from './api';
import { GROUPS_PATH } from './labels';

type Heifer = HeiferGroup['animals'][number];

/** 1.13 for a heifer potrero (4163:164634): read-only, since age and state decide who is in it. */
export function HeiferGroupPage() {
  const { key = '' } = useParams();
  const { t } = useTranslation();
  const groups = useHeiferGroups();
  const today = useMemo(() => new Date(), []);
  const group = groups.data?.find((g) => g.key === key);

  if (groups.data && !group) return <Navigate to={`${GROUPS_PATH}?tipo=vaquillas`} replace />;

  const columns: DataTableColumn<Heifer>[] = [
    {
      key: 'id',
      header: t('animals.columns.id.vaquillas'),
      sortValue: (h) => h.control_id,
      cell: (h) => (
        <Link
          to={`${ANIMALS_PATH}/${h.id}`}
          className={cx(
            'rounded-sm text-primary-text underline-offset-2 hover:underline',
            focusRing,
          )}
        >
          {h.control_id}
        </Link>
      ),
    },
    {
      key: 'raza',
      header: t('animals.columns.raza'),
      cell: (h) => t(`animals.values.raza.${h.breed}`),
    },
    {
      key: 'edad',
      header: t('animals.columns.edad'),
      align: 'right',
      sortValue: (h) => differenceInMonths(today, parseISO(h.birth_date)),
      cell: (h) =>
        t('animals.months', { count: differenceInMonths(today, parseISO(h.birth_date)) }),
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to={`${GROUPS_PATH}?tipo=vaquillas`}
          className={cx(
            'inline-flex items-center gap-1 rounded-sm text-primary type-label-md',
            focusRing,
          )}
        >
          <span aria-hidden>‹</span> {t('groups.detail.back')}
        </Link>
        <SplitIndicator label={t('groups.heifersIn')} count={group?.animals.length ?? 0} />
      </div>
      {groups.isError && <Banner tone="error">{t('groups.loadError')}</Banner>}
      {group && (
        <Card
          title={
            <span className="block text-center lg:text-left">
              {t(`groups.heifers.${group.key}`)}
            </span>
          }
        >
          <p className="text-secondary-text type-body-sm">
            {t(`groups.heifers.descriptions.${group.key}`)} {t('groups.heifers.computed')}
          </p>
          <DataTable
            label={t(`groups.heifers.${group.key}`)}
            columns={columns}
            rows={group.animals}
            getRowId={(h) => h.id}
            getRowLabel={(h) => h.control_id}
            empty={<p className="text-center text-secondary-text">{t('groups.heifers.empty')}</p>}
          />
        </Card>
      )}
    </div>
  );
}
