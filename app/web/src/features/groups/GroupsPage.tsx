import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useActiveRanch } from '../../app/useActiveRanch';
import { useIsDesktop } from '../../app/useIsDesktop';
import { Banner } from '../../ui/Banner';
import { Button } from '../../ui/Button';
import {
  iconBull,
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
  NEW_BULL_GROUP_PATH,
  NEW_GROUP_PATH,
  groupDescription,
  groupName,
  groupPath,
  isBullGroup,
  kpiFigure,
} from './labels';

type Tab = 'vacas' | 'vaquillas' | 'toros';
const TABS: Tab[] = ['vacas', 'vaquillas', 'toros'];

/** The Grupos tab (C1, C2, 1.12): cow potreros with their indicator, computed heifer ones, and
 * bull groups for the bulls on the ranch. No design has bull groups: they follow the cow screens. */
export function GroupsPage() {
  const { t } = useTranslation();
  const desktop = useIsDesktop();
  const [params, setParams] = useSearchParams();
  const tab: Tab = TABS.find((value) => value === params.get('tipo')) ?? 'vacas';

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
        onChange={(value) => setParams(value === 'vacas' ? {} : { tipo: value })}
        items={[
          {
            value: 'vacas',
            icon: iconCow,
            label: t('groups.tabs.vacas'),
            content: tab === 'vacas' ? <StoredGroups bulls={false} /> : null,
          },
          {
            value: 'vaquillas',
            icon: iconHeifer,
            label: t('groups.tabs.vaquillas'),
            content: tab === 'vaquillas' ? <HeiferGroups /> : null,
          },
          {
            value: 'toros',
            icon: iconBull,
            label: t('groups.tabs.toros'),
            content: tab === 'toros' ? <StoredGroups bulls /> : null,
          },
        ]}
      />
    </div>
  );
}

/** The stored groups of one kind: cow potreros, or bull groups. */
function StoredGroups({ bulls }: { bulls: boolean }) {
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
  const rows = (groups.data ?? []).filter((group) => isBullGroup(group) === bulls);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-between">
        <SplitIndicator label={t('groups.inSystem')} count={rows.length} />
        {can('GROUPS_CREATE') && (
          <Button
            leadingIcon={iconGroups}
            onClick={() => navigate(bulls ? NEW_BULL_GROUP_PATH : NEW_GROUP_PATH)}
          >
            {t(bulls ? 'groups.bulls.add' : 'groups.add')}
          </Button>
        )}
      </div>
      {bulls && (
        <p className="text-center text-secondary-text type-body-sm lg:text-left">
          {t('groups.bulls.onRanchOnly')}
        </p>
      )}
      {bulls && groups.data && rows.length === 0 && (
        <p className="text-center text-secondary-text">{t('groups.bulls.none')}</p>
      )}
      <ul
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        aria-busy={groups.isPending}
      >
        {rows.map((group) => (
          <li key={group.id}>
            <GroupCard
              title={groupName(group, t)}
              description={groupDescription(group, t)}
              countLabel={t(bulls ? 'groups.bullsIn' : 'groups.animalsIn')}
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
