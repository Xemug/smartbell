import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useActiveRanch } from '../../app/useActiveRanch';
import { Banner } from '../../ui/Banner';
import { Card } from '../../ui/Card';
import { ChipGroup } from '../../ui/ChipGroup';
import { RadioGroup } from '../../ui/RadioGroup';
import { Select } from '../../ui/Select';
import { TextArea } from '../../ui/TextArea';
import { TextField } from '../../ui/TextField';
import { Wizard } from '../../ui/Wizard';
import { BREEDS, GROUP_PRESETS } from '../animals/list/listState';
import {
  useAutoPreview,
  useCreateGroup,
  useGroupList,
  type AutoFilter,
  type GroupPreset,
  type KpiIndicator,
} from './api';
import { CowPicker } from './CowPicker';
import { GROUPS_PATH, KPI_ICONS, KPI_INDICATORS, groupPath } from './labels';

type Field = AutoFilter['field'];
const FIELDS: Field[] = ['AGE', 'BREED', 'LACTATIONS'];
const COUNT_CHIPS = ['1', '2', '3', '4', '5', '6', 'MAS'];
const NAME_MAX = 60;
const DESCRIPTION_MAX = 120;
const NO_KPI = 'NONE';

/** C3 / 1.10–1.11: Datos generales → Método selección vacas → Selección de indicador. */
export function NewGroupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { can } = useActiveRanch();
  const groups = useGroupList();
  const create = useCreateGroup();

  const freePresets = useMemo(() => {
    const used = new Set((groups.data ?? []).map((g) => g.preset));
    return GROUP_PRESETS.filter((p) => !used.has(p));
  }, [groups.data]);

  const [step, setStep] = useState(0);
  const [kind, setKind] = useState<'preset' | 'custom'>('custom');
  const [preset, setPreset] = useState<GroupPreset | ''>('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [method, setMethod] = useState<'AUTO' | 'MANUAL'>('MANUAL');
  const [field, setField] = useState<Field>('AGE');
  const [values, setValues] = useState<string[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [kpi, setKpi] = useState<KpiIndicator | typeof NO_KPI>(NO_KPI);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rule: AutoFilter | null = method === 'AUTO' ? { field, values } : null;
  const preview = useAutoPreview(rule);
  const cowCount = method === 'AUTO' ? (preview.data?.length ?? 0) : picked.length;

  const nameMissing = kind === 'custom' ? name.trim() === '' : preset === '';
  // An AUTO rule's count decides whether an indicator can be picked, so wait for it.
  const previewReady = preview.data !== undefined && !preview.isFetching;
  const stepValid = [
    !nameMissing,
    method === 'MANUAL' || (values.length > 0 && previewReady),
    true,
  ][step];
  const dirty =
    name !== '' || description !== '' || preset !== '' || values.length > 0 || picked.length > 0;

  if (!can('GROUPS_CREATE')) {
    return (
      <div className="mx-auto max-w-3xl p-4">
        <Banner tone="error">{t('groups.loadError')}</Banner>
      </div>
    );
  }

  const finish = () => {
    setError(null);
    create.mutate(
      {
        ...(kind === 'preset' && preset ? { preset } : { name: name.trim() }),
        description: description.trim() || null,
        selection: method,
        ...(rule ? { auto_filter: rule } : { animal_ids: picked }),
        kpi_indicator: kpi === NO_KPI || cowCount === 0 ? null : kpi,
      },
      {
        // The new potrero's page says it was created, at the top where it can't be missed.
        onSuccess: (group) =>
          navigate(groupPath(group.id), { replace: true, state: { created: true } }),
        onError: (failure) =>
          setError(
            failure.message === 'group_name_taken'
              ? t('groups.detail.nameTaken')
              : failure.message === 'kpi_needs_animals'
                ? t('groups.kpi.needsCows')
                : t('groups.wizard.error'),
          ),
      },
    );
  };

  const next = () => {
    setTouched(true);
    if (!stepValid) return;
    setTouched(false);
    if (step < 2) setStep(step + 1);
    else finish();
  };

  const steps = [
    t('groups.wizard.steps.general'),
    t('groups.wizard.steps.selection'),
    t('groups.wizard.steps.kpi'),
  ];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4">
      <h1 className="text-center ramp-page-title text-primary">{t('groups.wizard.title')}</h1>
      <Card>
        <Wizard
          steps={steps}
          step={step}
          dirty={dirty}
          onNext={next}
          onBack={() => (step === 0 ? navigate(GROUPS_PATH) : setStep(step - 1))}
          finishLabel={t('groups.wizard.finish')}
          nextLoading={create.isPending}
          nextDisabled={
            (touched && !stepValid) || (step === 1 && method === 'AUTO' && preview.isFetching)
          }
        >
          {error && (
            <Banner tone="error" onClose={() => setError(null)} className="mb-4">
              {error}
            </Banner>
          )}
          {step === 0 && (
            <div className="flex flex-col gap-4">
              <RadioGroup
                label={t('groups.wizard.type')}
                orientation="horizontal"
                variant="card"
                options={[
                  {
                    value: 'preset',
                    label: t('groups.wizard.preset'),
                    disabled: freePresets.length === 0,
                    description:
                      freePresets.length === 0 ? t('groups.wizard.presetsUsed') : undefined,
                  },
                  { value: 'custom', label: t('groups.wizard.custom') },
                ]}
                value={kind}
                onChange={(value) => setKind(value as 'preset' | 'custom')}
              />
              {kind === 'preset' ? (
                <Select
                  label={t('groups.wizard.name')}
                  required
                  error={touched && nameMissing ? t('groups.wizard.nameRequired') : undefined}
                  options={freePresets.map((p) => ({ value: p, label: t(`groups.presets.${p}`) }))}
                  value={preset}
                  onChange={(value) => {
                    setPreset(value as GroupPreset);
                    if (!description) setDescription(t(`groups.presetDescriptions.${value}`));
                  }}
                />
              ) : (
                <TextField
                  label={t('groups.wizard.name')}
                  required
                  placeholder={t('groups.wizard.namePlaceholder')}
                  maxLength={NAME_MAX}
                  hint={`${name.length}/${NAME_MAX}`}
                  error={touched && nameMissing ? t('groups.wizard.nameRequired') : undefined}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              )}
              <TextArea
                label={t('groups.wizard.description')}
                maxLength={DESCRIPTION_MAX}
                hint={`${description.length}/${DESCRIPTION_MAX}`}
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
          )}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <RadioGroup
                label={t('groups.wizard.method')}
                orientation="horizontal"
                variant="card"
                options={[
                  { value: 'AUTO', label: t('groups.wizard.auto') },
                  { value: 'MANUAL', label: t('groups.wizard.manual') },
                ]}
                value={method}
                onChange={(value) => setMethod(value as 'AUTO' | 'MANUAL')}
              />
              {method === 'AUTO' ? (
                <div className="flex flex-col gap-3">
                  <Select
                    label={t('groups.wizard.filterField')}
                    options={FIELDS.map((f) => ({
                      value: f,
                      label: t(`groups.wizard.fields.${f}`),
                    }))}
                    value={field}
                    onChange={(value) => {
                      setField(value as Field);
                      setValues([]);
                    }}
                  />
                  <ChipGroup
                    label={t('groups.wizard.values')}
                    layout="wrap"
                    options={(field === 'BREED' ? BREEDS : COUNT_CHIPS).map((value) => ({
                      value,
                      label:
                        field === 'BREED'
                          ? t(`animals.values.raza.${value}`)
                          : value === 'MAS'
                            ? t('groups.wizard.more')
                            : value,
                    }))}
                    value={values}
                    onChange={setValues}
                  />
                  {touched && values.length === 0 && (
                    <p className="text-error type-body-sm">{t('groups.wizard.pickOne')}</p>
                  )}
                  {values.length > 0 && preview.data && (
                    <p className="type-label-md text-primary" aria-live="polite">
                      {t('groups.wizard.matches', { count: preview.data.length })}
                    </p>
                  )}
                  <p className="text-secondary-text type-body-sm">{t('groups.wizard.autoNote')}</p>
                </div>
              ) : (
                <CowPicker selected={picked} onChange={setPicked} />
              )}
            </div>
          )}
          {step === 2 && (
            <div className="flex flex-col gap-3">
              {cowCount === 0 && <Banner tone="info">{t('groups.kpi.needsCows')}</Banner>}
              <RadioGroup
                label={t('groups.kpi.label')}
                variant="card"
                disabled={cowCount === 0}
                options={[
                  ...KPI_INDICATORS.map((value) => ({
                    value,
                    label: t(`groups.kpi.${value}`),
                    description: t(`groups.kpi.hints.${value}`),
                    icon: KPI_ICONS[value],
                  })),
                  {
                    value: NO_KPI,
                    label: t('groups.kpi.none'),
                    description: t('groups.kpi.noneHint'),
                  },
                ]}
                value={cowCount === 0 ? NO_KPI : kpi}
                onChange={(value) => setKpi(value as KpiIndicator)}
              />
            </div>
          )}
        </Wizard>
      </Card>
    </div>
  );
}
