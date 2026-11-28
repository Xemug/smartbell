import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

import { useActiveRanch } from '../../app/useActiveRanch';
import { Banner } from '../../ui/Banner';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { cx, focusRing } from '../../ui/cx';
import {
  DataTable,
  PAGE_SIZE,
  type DataTableColumn,
  type DataTableRowAction,
} from '../../ui/DataTable';
import {
  iconArrowRight,
  iconBull,
  iconCow,
  iconRefresh,
  iconTrash,
  iconX,
} from '../../ui/icons/glyphs';
import { IconButton } from '../../ui/IconButton';
import { Modal } from '../../ui/Modal';
import { Select } from '../../ui/Select';
import { SplitIndicator } from '../../ui/SplitIndicator';
import { TextArea } from '../../ui/TextArea';
import { TextField } from '../../ui/TextField';
import { useSnackbar } from '../../ui/useSnackbar';
import { ANIMALS_PATH } from '../animals/list/AnimalListPage';
import { daysInMilk } from '../animals/list/animalFacts';
import { useAnimalPage, type Animal } from '../animals/list/api';
import {
  GroupNameTaken,
  useGroup,
  useMoveAnimals,
  useReevaluate,
  useUpdateGroup,
  type GroupOut,
  type KpiIndicator,
} from './api';
import { CowPicker } from './CowPicker';
import { DeleteGroupDialog } from './DeleteGroupDialog';
import { MoveToGroupDialog } from './MoveToGroupDialog';
import {
  BULL_GROUPS_PATH,
  GROUPS_PATH,
  KPI_INDICATORS,
  groupDescription,
  groupName,
  isBullGroup,
} from './labels';

const NO_KPI = 'NONE';

/** C5 / 1.13: one potrero, its cows, and what can be done to it. */
export function GroupDetailPage() {
  const { id = '' } = useParams();
  const { t } = useTranslation();
  const group = useGroup(id);

  if (group.isError) {
    return (
      <div className="mx-auto max-w-6xl p-4">
        <Banner tone="error">{t('groups.detail.notFound')}</Banner>
        <BackLink />
      </div>
    );
  }
  if (!group.data) return null;
  return <Detail group={group.data} />;
}

function BackLink({ bulls = false }: { bulls?: boolean }) {
  const { t } = useTranslation();
  return (
    <Link
      to={bulls ? BULL_GROUPS_PATH : GROUPS_PATH}
      className={cx(
        'inline-flex items-center gap-1 rounded-sm text-primary type-label-md',
        focusRing,
      )}
    >
      <span aria-hidden>‹</span> {t('groups.detail.back')}
    </Link>
  );
}

function Detail({ group }: { group: GroupOut }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const { can } = useActiveRanch();
  const canEdit = can('GROUPS_VIEW_EDIT');
  const isAuto = group.selection === 'AUTO';
  // A bull group lists bulls on the ranch and has no indicator (no design: it follows C5).
  const bulls = isBullGroup(group);

  const update = useUpdateGroup(group.id);
  const reevaluate = useReevaluate(group.id);
  const bring = useMoveAnimals();

  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description ?? '');
  const [kpi, setKpi] = useState<string>(group.kpi_indicator ?? NO_KPI);
  const [formError, setFormError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  // Arriving from the wizard: say the potrero was created until it's dismissed.
  const location = useLocation();
  const [justCreated, setJustCreated] = useState(
    (location.state as { created?: boolean } | null)?.created === true,
  );
  useEffect(() => {
    // A reload or a later visit shouldn't announce it again.
    if (justCreated) navigate(location.pathname, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    setName(group.name);
    setDescription(group.description ?? '');
    setKpi(group.kpi_indicator ?? NO_KPI);
    // A saved group comes back from the server; the form follows it.
  }, [group.id, group.name, group.description, group.kpi_indicator]);

  const [page, setPage] = useState(1);
  // General also holds the animals with no group, which only its preset filter finds.
  const members = useAnimalPage({
    group: group.preset === 'GENERAL' ? 'GENERAL' : group.id,
    // A cow potrero lists cows (heifers have their own groups); a bull group, its bulls.
    ...(bulls ? { kind: 'TORO' as const, on_ranch: true } : { kind: 'VACA' as const }),
    page,
    page_size: PAGE_SIZE,
  });
  const rows = members.data?.items ?? [];
  const today = useMemo(() => new Date(), []);

  const [selected, setSelected] = useState<string[]>([]);
  const [toMove, setToMove] = useState<string[] | null>(null);
  const [bringing, setBringing] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [bringFailed, setBringFailed] = useState<'semen' | 'other' | null>(null);
  const [deleting, setDeleting] = useState(false);
  const moveFrom = useRef<HTMLElement | null>(null);

  const dirty =
    name !== group.name ||
    description !== (group.description ?? '') ||
    kpi !== (group.kpi_indicator ?? NO_KPI);
  const total = group.animal_count ?? 0;

  const save = () => {
    setFormError(null);
    setNameError(null);
    update.mutate(
      {
        ...(group.preset ? {} : { name: name.trim() }),
        description: description.trim() || null,
        ...(bulls ? {} : { kpi_indicator: kpi === NO_KPI ? null : (kpi as KpiIndicator) }),
      },
      {
        onSuccess: () => snackbar.show({ kind: 'success', message: t('groups.detail.saved') }),
        onError: (failure) =>
          failure instanceof GroupNameTaken
            ? setNameError(t('groups.detail.nameTaken', { name: failure.existingName }))
            : setFormError(t('groups.detail.saveError')),
      },
    );
  };

  const columns: DataTableColumn<Animal>[] = [
    {
      key: 'id',
      header: t(`animals.columns.id.${bulls ? 'toros' : 'vacas'}`),
      cell: (a) => (
        <Link
          to={`${ANIMALS_PATH}/${a.id}`}
          className={cx(
            'rounded-sm text-primary-text underline-offset-2 hover:underline',
            focusRing,
          )}
        >
          {a.control_id}
        </Link>
      ),
    },
    {
      key: 'raza',
      header: t('animals.columns.raza'),
      cell: (a) => t(`animals.values.raza.${a.breed}`),
    },
    bulls
      ? {
          key: 'disponibilidad',
          header: t('animals.columns.disponibilidad'),
          cell: (a) =>
            a.bull_availability ? t(`animals.values.disponibilidad.${a.bull_availability}`) : '—',
        }
      : {
          key: 'dim',
          header: t('animals.columns.dim'),
          align: 'right',
          cell: (a) => daysInMilk(a, today) ?? '—',
        },
  ];
  const rowActions: DataTableRowAction<Animal>[] | undefined = canEdit
    ? [
        {
          label: t('groups.detail.move'),
          icon: iconArrowRight,
          onClick: (animal) => {
            moveFrom.current = document.activeElement as HTMLElement | null;
            setToMove([animal.id]);
          },
        },
      ]
    : undefined;

  const confirmBring = () =>
    bring.mutate(
      { groupId: group.id, animalIds: picked },
      {
        onSuccess: (result) => {
          snackbar.show({
            kind: 'success',
            message: t('groups.moveDialog.done', {
              count: result.moved.length,
              name: groupName(group, t),
            }),
          });
          setBringing(false);
          setPicked([]);
          setBringFailed(null);
        },
        // Shown in the dialog, which covers the page's own banner.
        onError: (failure) =>
          setBringFailed(failure.message === 'bull_semen_only' ? 'semen' : 'other'),
      },
    );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BackLink bulls={bulls} />
        <SplitIndicator label={t(bulls ? 'groups.bullsIn' : 'groups.animalsIn')} count={total} />
      </div>

      <Card
        title={
          <span className="flex items-center justify-center gap-2 lg:justify-start">
            {groupName(group, t)}
          </span>
        }
      >
        {justCreated && (
          <Banner tone="success" onClose={() => setJustCreated(false)}>
            {t('groups.wizard.created', { name: groupName(group, t) })}
          </Banner>
        )}
        {formError && (
          <Banner tone="error" onClose={() => setFormError(null)}>
            {formError}
          </Banner>
        )}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[20rem_1fr]">
          <div className="flex flex-col gap-4">
            {!group.preset && (
              <TextField
                label={t('groups.wizard.name')}
                maxLength={60}
                hint={`${name.length}/60`}
                disabled={!canEdit}
                value={name}
                error={
                  name.trim() === '' ? t('groups.wizard.nameRequired') : (nameError ?? undefined)
                }
                onChange={(event) => {
                  setNameError(null);
                  setName(event.target.value);
                }}
              />
            )}
            <TextArea
              label={t('groups.wizard.description')}
              maxLength={120}
              hint={`${description.length}/120`}
              rows={3}
              disabled={!canEdit}
              placeholder={groupDescription(group, t) ?? undefined}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
            {!bulls && (
              <Select
                label={t('groups.kpi.label')}
                hint={total === 0 ? t('groups.kpi.needsCows') : undefined}
                disabled={!canEdit || (total === 0 && kpi === NO_KPI)}
                options={[
                  { value: NO_KPI, label: t('groups.kpi.none') },
                  ...KPI_INDICATORS.map((value) => ({ value, label: t(`groups.kpi.${value}`) })),
                ]}
                value={kpi}
                onChange={setKpi}
              />
            )}
            {canEdit && (
              <Button
                onClick={save}
                loading={update.isPending}
                disabled={!dirty || (!group.preset && name.trim() === '')}
              >
                {t('groups.detail.save')}
              </Button>
            )}
            {isAuto && group.auto_filter && (
              <div className="flex flex-col gap-2 rounded-moon-i-xs bg-primary-10 p-3">
                <span className="type-label-md text-primary">{t('groups.detail.rule')}</span>
                <span className="type-body-sm">
                  {t(`groups.wizard.fields.${group.auto_filter.field}`)}:{' '}
                  {group.auto_filter.values
                    .map((v) =>
                      group.auto_filter?.field === 'BREED'
                        ? t(`animals.values.raza.${v}`)
                        : v === 'MAS'
                          ? t('groups.wizard.more')
                          : v,
                    )
                    .join(', ')}
                </span>
                <span className="text-secondary-text type-body-sm">
                  {t('groups.wizard.autoNote')}
                </span>
                {canEdit && (
                  <Button
                    size="sm"
                    variant="outline"
                    leadingIcon={iconRefresh}
                    loading={reevaluate.isPending}
                    onClick={() =>
                      reevaluate.mutate(undefined, {
                        onSuccess: (result) =>
                          snackbar.show({
                            kind: 'success',
                            message: t('groups.detail.reevaluated', {
                              in: result.came_in.length,
                              out: result.went_out.length,
                            }),
                          }),
                      })
                    }
                  >
                    {t('groups.detail.reevaluate')}
                  </Button>
                )}
              </div>
            )}
            {canEdit && !isAuto && (
              <Button
                variant="outline"
                leadingIcon={bulls ? iconBull : iconCow}
                onClick={() => setBringing(true)}
              >
                {t(bulls ? 'groups.bulls.bring' : 'groups.detail.bring')}
              </Button>
            )}
            {can('GROUPS_DELETE') && group.preset !== 'GENERAL' && (
              <Button variant="danger" leadingIcon={iconTrash} onClick={() => setDeleting(true)}>
                {t('groups.delete')}
              </Button>
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-3">
            {selected.length > 0 && canEdit && (
              <div
                role="region"
                aria-label={t('animals.bulk.label')}
                className="flex flex-wrap items-center gap-3 rounded-moon-i-xs bg-primary-10 px-3 py-2"
              >
                <span className="type-label-md text-primary-text">
                  {t('animals.bulk.selected', { count: selected.length })}
                </span>
                <Button
                  size="sm"
                  leadingIcon={iconArrowRight}
                  onClick={(event) => {
                    moveFrom.current = event.currentTarget;
                    setToMove(selected);
                  }}
                >
                  {t('animals.bulk.move')}
                </Button>
                <IconButton
                  icon={iconX}
                  size="sm"
                  variant="ghost"
                  label={t('animals.bulk.clear')}
                  onClick={() => setSelected([])}
                />
              </div>
            )}
            <DataTable
              label={groupName(group, t)}
              columns={columns}
              rows={rows}
              getRowId={(a) => a.id}
              getRowLabel={(a) => a.control_id}
              rowActions={rowActions}
              selected={canEdit ? selected : undefined}
              onSelectionChange={canEdit ? setSelected : undefined}
              total={members.data?.total ?? 0}
              page={page}
              onPageChange={setPage}
              loading={members.isFetching && !members.data}
              empty={
                <p className="text-center text-secondary-text">
                  {t(bulls ? 'groups.bulls.empty' : 'groups.detail.empty')}
                </p>
              }
            />
          </div>
        </div>
      </Card>

      <MoveToGroupDialog
        animalIds={toMove}
        fromGroupId={group.id}
        bulls={bulls}
        onClose={() => setToMove(null)}
        onMoved={(ids) => setSelected((current) => current.filter((x) => !ids.includes(x)))}
        returnFocus={moveFrom}
      />
      <Modal
        open={bringing}
        onOpenChange={(open) => {
          if (!open && !bring.isPending) setBringing(false);
        }}
        title={t(bulls ? 'groups.bulls.bringTitle' : 'groups.bringDialog.title')}
        className="lg:max-w-3xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setBringing(false)} disabled={bring.isPending}>
              {t('ui.cancel')}
            </Button>
            <Button loading={bring.isPending} disabled={picked.length === 0} onClick={confirmBring}>
              {t('groups.bringDialog.confirm', { count: picked.length })}
            </Button>
          </>
        }
      >
        {bringFailed && (
          <Banner tone="error" onClose={() => setBringFailed(null)} className="mb-3">
            {t(bringFailed === 'semen' ? 'groups.bulls.semenOnly' : 'groups.moveDialog.error')}
          </Banner>
        )}
        <CowPicker bulls={bulls} selected={picked} onChange={setPicked} />
      </Modal>
      {deleting && (
        <DeleteGroupDialog
          group={group}
          onClose={() => setDeleting(false)}
          onDeleted={() => navigate(bulls ? BULL_GROUPS_PATH : GROUPS_PATH, { replace: true })}
        />
      )}
    </div>
  );
}
