import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useActiveRanch } from '../../app/useActiveRanch';
import { useIsDesktop } from '../../app/useIsDesktop';
import { Banner } from '../../ui/Banner';
import { Button } from '../../ui/Button';
import {
  iconCow,
  iconEye,
  iconGroups,
  iconHeifer,
  iconPencil,
  iconTrash,
} from '../../ui/icons/glyphs';
import { SplitIndicator } from '../../ui/SplitIndicator';
import { Tabs } from '../../ui/Tabs';
import { useGroupList, useHeiferGroups, type GroupOut } from './api';
import { DeleteGroupDialog } from './DeleteGroupDialog';
import { GroupCard } from './GroupCard';
import {
  HEIFER_GROUPS_PATH,
  KPI_ICONS,
  NEW_GROUP_PATH,
  groupDescription,
  groupName,
  groupPath,
  kpiFigure,
} from './labels';

type Tab = 'vacas' | 'vaquillas';

/** The Grupos tab (C1, C2, 1.12): cow potreros with their indicator, and computed heifer ones. */
export function GroupsPage() {
  const { t } = useTranslation();
  const desktop = useIsDesktop();
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get('tipo') === 'vaquillas' ? 'vaquillas' : 'vacas';

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4">
      <h1 className="text-center ramp-page-title text-primary">
        <Trans
          i18nKey={`groups.title.${tab}`}
          components={{ b: <strong className="font-bold" /> }}
        />
      </h1>
      <Tabs
        label={t('groups.tabsLabel')}
        type="solid"
        size={desktop ? 'md' : 'sm'}
        value={tab}
        onChange={(value) => setParams(value === 'vaquillas' ? { tipo: 'vaquillas' } : {})}
        items={[
          {
            value: 'vacas',
            icon: iconCow,
            label: t('groups.tabs.vacas'),
            content: tab === 'vacas' ? <CowGroups /> : null,
          },
          {
            value: 'vaquillas',
            icon: iconHeifer,
            label: t('groups.tabs.vaquillas'),
            content: tab === 'vaquillas' ? <HeiferGroups /> : null,
          },
        ]}
      />
    </div>
  );
}

function CowGroups() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { can } = useActiveRanch();
  const groups = useGroupList();
  const [toDelete, setToDelete] = useState<GroupOut | null>(null);

  if (groups.isError) {
    return (
      <Banner tone="error" title={t('groups.loadError')}>
        <Button size="sm" variant="outline" onClick={() => void groups.refetch()}>
          {t('groups.retry')}
        </Button>
      </Banner>
    );
  }
  const rows = groups.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-between">
        <SplitIndicator label={t('groups.inSystem')} count={rows.length} />
        {can('GROUPS_CREATE') && (
          <Button leadingIcon={iconGroups} onClick={() => navigate(NEW_GROUP_PATH)}>
            {t('groups.add')}
          </Button>
        )}
      </div>
      <ul
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        aria-busy={groups.isPending}
      >
        {rows.map((group) => (
          <li key={group.id}>
            <GroupCard
              title={groupName(group, t)}
              description={groupDescription(group, t)}
              countLabel={t('groups.animalsIn')}
              count={group.animal_count ?? 0}
              kpi={
                group.kpi_indicator
                  ? {
                      icon: KPI_ICONS[group.kpi_indicator],
                      label: t(`groups.kpi.${group.kpi_indicator}`),
                      value: kpiFigure(group.kpi_value),
                    }
                  : null
              }
              actions={
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    trailingIcon={can('GROUPS_VIEW_EDIT') ? iconPencil : iconEye}
                    onClick={() => navigate(groupPath(group.id))}
                    aria-label={`${can('GROUPS_VIEW_EDIT') ? t('groups.edit') : t('groups.seeMore')} ${groupName(group, t)}`}
                  >
                    {can('GROUPS_VIEW_EDIT') ? t('groups.edit') : t('groups.seeMore')}
                  </Button>
                  {can('GROUPS_DELETE') && group.preset !== 'GENERAL' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      trailingIcon={iconTrash}
                      onClick={() => setToDelete(group)}
                      aria-label={`${t('groups.delete')} ${groupName(group, t)}`}
                    >
                      {t('groups.delete')}
                    </Button>
                  )}
                </>
              }
            />
          </li>
        ))}
      </ul>
      <DeleteGroupDialog group={toDelete} onClose={() => setToDelete(null)} />
    </div>
  );
}

function HeiferGroups() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const heifers = useHeiferGroups();

  if (heifers.isError) {
    return (
      <Banner tone="error" title={t('groups.loadError')}>
        <Button size="sm" variant="outline" onClick={() => void heifers.refetch()}>
          {t('groups.retry')}
        </Button>
      </Banner>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <p className="text-center text-secondary-text type-body-sm lg:text-left">
        {t('groups.heifers.computed')}
      </p>
      <ul
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        aria-busy={heifers.isPending}
      >
        {(heifers.data ?? []).map((group) => (
          <li key={group.key}>
            <GroupCard
              title={t(`groups.heifers.${group.key}`)}
              description={t(`groups.heifers.descriptions.${group.key}`)}
              countLabel={t('groups.heifersIn')}
              count={group.animals.length}
              actions={
                <Button
                  size="sm"
                  variant="ghost"
                  trailingIcon={iconEye}
                  onClick={() => navigate(`${HEIFER_GROUPS_PATH}/${group.key}`)}
                  aria-label={`${t('groups.seeMore')} ${t(`groups.heifers.${group.key}`)}`}
                >
                  {t('groups.seeMore')}
                </Button>
              }
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
