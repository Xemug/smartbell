import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState, type ReactNode } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useActiveRanch } from '../../../app/useActiveRanch';
import { Banner } from '../../../ui/Banner';
import { Button } from '../../../ui/Button';
import { Card } from '../../../ui/Card';
import { DateField } from '../../../ui/DateField';
import { FormField } from '../../../ui/FormField';
import { iconBull, iconChevronDown, iconChevronUp, iconCow } from '../../../ui/icons/glyphs';
import { NumberField } from '../../../ui/NumberField';
import { RadioGroup } from '../../../ui/RadioGroup';
import { Select } from '../../../ui/Select';
import { TextField } from '../../../ui/TextField';
import { useSnackbar } from '../../../ui/useSnackbar';
import { useGroups } from '../list/api';
import { CreateError, useCreateAnimal, type AnimalCreated } from './api';
import { BullSection } from './BullSection';
import { DamStatusDialog } from './DamStatusDialog';
import {
  animalSchema,
  DETAILED_FIELDS,
  defaultValues,
  fieldRefusal,
  isHeifer,
  NO_REPRO_STAGE,
  parentLabel,
  showsRepro,
  toCreateBody,
  type AnimalValues,
  type DamStatus,
  type ParentChoice,
  type Sex,
} from './formModel';
import { breedOptions, crossbreedOptions, reproOptions, stageOptions } from './options';
import { ParentDialog } from './ParentDialog';

type Slot = 'dam' | 'sire';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card title={title} className="h-fit">
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </Card>
  );
}

/**
 * The unified "Primer animal" form (v4 §1.1, §1.10): quick mode asks for four fields, "Tengo más
 * datos de mi animal" opens the rest. Reusable by onboarding's first-cow step.
 */
export function AnimalForm({
  initialSex = 'HEMBRA',
  onCreated,
}: {
  initialSex?: Sex;
  onCreated: (created: AnimalCreated) => void;
}) {
  const { t } = useTranslation();
  const snackbar = useSnackbar();
  const { can } = useActiveRanch();
  const groups = useGroups();
  const create = useCreateAnimal();
  const [detailed, setDetailed] = useState(false);
  const [parents, setParents] = useState<Record<Slot, ParentChoice | null>>({
    dam: null,
    sire: null,
  });
  const [parentErrors, setParentErrors] = useState<Record<Slot, string | null>>({
    dam: null,
    sire: null,
  });
  const [dialog, setDialog] = useState<Slot | null>(null);
  const [pending, setPending] = useState<AnimalValues | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { control, handleSubmit, setValue, setError, getValues } = useForm<AnimalValues>({
    resolver: zodResolver(animalSchema),
    defaultValues: defaultValues(initialSex),
  });
  const [sex, level, stage, birthDate, reproStage] = useWatch({
    control,
    name: ['sex', 'crossbreedLevel', 'developmentStage', 'birthDate', 'reproStage'],
  });

  // Potrero starts on the ranch's General group once the groups are in.
  const generalId = groups.data?.find((group) => group.preset === 'GENERAL')?.id;
  useEffect(() => {
    if (generalId && !getValues('groupId')) setValue('groupId', generalId);
  }, [generalId, getValues, setValue]);

  const repro = detailed && showsRepro(sex, stage, birthDate);

  const send = (values: AnimalValues, damStatus: DamStatus | null) => {
    setFormError(null);
    setParentErrors({ dam: null, sire: null });
    const body = toCreateBody(values, { ...parents, damStatus });
    create.mutate(body, {
      onSuccess: (created) => {
        setPending(null);
        snackbar.show({
          kind: 'success',
          message: t('animalForm.created', { id: created.control_id }),
        });
        onCreated(created);
      },
      onError: (error) => {
        setPending(null);
        if (!(error instanceof CreateError) || error.fields.length === 0) {
          const code = error instanceof CreateError ? error.code : 'generic';
          setFormError(
            t(`animalForm.errors.${code}`, { defaultValue: t('animalForm.errors.generic') }),
          );
          return;
        }
        let first = true;
        for (const refusal of error.fields) {
          const where = fieldRefusal(refusal.loc, refusal.msg);
          const parent = where.parent;
          if (parent) {
            setDetailed(true);
            setParentErrors((current) => ({ ...current, [parent]: where.message }));
          } else if (where.field) {
            if (DETAILED_FIELDS.has(where.field)) setDetailed(true);
            setError(where.field, { message: where.message }, { shouldFocus: first });
            first = false;
          } else {
            setFormError(where.message);
          }
        }
        snackbar.show({ kind: 'error', message: t('animalForm.fixErrors') });
      },
    });
  };

  const submit = handleSubmit(
    (values) => {
      // §7.1: a heifer registered with her dam says how the dam is.
      if (parents.dam && isHeifer(values)) setPending(values);
      else send(values, null);
    },
    (errors) => {
      // A hidden field can be the one at fault: show it.
      if (Object.keys(errors).some((name) => DETAILED_FIELDS.has(name as keyof AnimalValues))) {
        setDetailed(true);
      }
      snackbar.show({ kind: 'error', message: t('animalForm.fillRequired') });
    },
  );

  const changeSex = (next: Sex) => {
    setValue('sex', next);
    // Each sex has its own stage list.
    setValue('developmentStage', 'AUTO');
  };

  const saveParent = (slot: Slot, choice: ParentChoice | null) => {
    setParents((current) => ({ ...current, [slot]: choice }));
    setParentErrors((current) => ({ ...current, [slot]: null }));
    setDialog(null);
    if (choice?.kind === 'new') {
      snackbar.show({
        kind: 'success',
        message: t(`animalForm.parents.${slot}.added`, { id: choice.body.control_id }),
      });
    }
  };

  const general = (
    <Section title={t('animalForm.sections.general')}>
      <FormField
        control={control}
        name="controlId"
        render={(field) => (
          <TextField
            {...field}
            autoComplete="off"
            maxLength={60}
            required
            label={t('animalForm.fields.controlId')}
            placeholder="123"
            className="col-span-2"
          />
        )}
      />
      <FormField
        control={control}
        name="breed"
        render={(field) => (
          <Select
            {...field}
            label={t('animalForm.fields.breed')}
            options={breedOptions(t)}
            className="col-span-2"
          />
        )}
      />
      <FormField
        control={control}
        name="birthDate"
        render={(field) => (
          <DateField
            {...field}
            required
            maxDate="today"
            label={t('animalForm.fields.birthDate')}
            className="col-span-2"
          />
        )}
      />
      <FormField
        control={control}
        name="groupId"
        render={(field) => (
          <Select
            {...field}
            label={t('animalForm.fields.group')}
            // No group is the General potrero; a ranch may have no groups yet.
            placeholder={t('animals.values.grupo.GENERAL')}
            disabled={!groups.data?.length}
            // An AUTO potrero picks its own cows, so it isn't a place to register one into.
            options={(groups.data ?? [])
              .filter((group) => group.selection !== 'AUTO')
              .map((group) => ({
                value: group.id,
                label: group.preset ? t(`animals.values.grupo.${group.preset}`) : group.name,
              }))}
            className="col-span-2"
          />
        )}
      />
      <Button
        type="button"
        variant="outline"
        fullWidth
        trailingIcon={detailed ? iconChevronUp : iconChevronDown}
        aria-expanded={detailed}
        onClick={() => setDetailed((open) => !open)}
        className="col-span-2"
      >
        {detailed ? t('animalForm.lessData') : t('animalForm.moreData')}
      </Button>
    </Section>
  );

  const parentButton = (slot: Slot) => {
    const choice = parents[slot];
    const label = t(`animalForm.parents.${slot}.button`);
    return (
      <div className="flex flex-col gap-1">
        <Button
          type="button"
          variant="outline"
          fullWidth
          onClick={() => setDialog(slot)}
          aria-label={
            choice ? t(`animalForm.parents.${slot}.chosen`, { id: parentLabel(choice) }) : label
          }
        >
          {choice ? t(`animalForm.parents.${slot}.chosen`, { id: parentLabel(choice) }) : label}
        </Button>
        {parentErrors[slot] && (
          <p className="text-error type-body-sm" role="alert">
            {parentErrors[slot]}
          </p>
        )}
      </div>
    );
  };

  const additional = (
    <Section title={t('animalForm.sections.additional')}>
      <FormField
        control={control}
        name="crossbreedLevel"
        render={(field) => (
          <Select
            {...field}
            onChange={(value) => {
              field.onChange(value);
              if (value === 'FB') setValue('contributingBreed', '');
            }}
            label={t('animalForm.fields.crossbreedLevel')}
            options={crossbreedOptions(t)}
          />
        )}
      />
      <FormField
        control={control}
        name="contributingBreed"
        render={(field) => (
          <Select
            {...field}
            label={t('animalForm.fields.contributingBreed')}
            placeholder={t('animalForm.choose')}
            options={breedOptions(t)}
            disabled={level === 'FB'}
            required={level !== 'FB'}
          />
        )}
      />
      <FormField
        control={control}
        name="developmentStage"
        render={(field) => (
          <Select
            {...field}
            label={t('animalForm.fields.developmentStage')}
            options={stageOptions(t, sex)}
            className="col-span-2"
          />
        )}
      />
      <FormField
        control={control}
        name="siniiga"
        render={(field) => (
          <TextField
            {...field}
            autoComplete="off"
            inputMode="numeric"
            maxLength={20}
            label={t('animalForm.fields.siniiga')}
            hint={t('animalForm.siniigaHint')}
            placeholder="1012345678"
            className="col-span-2"
          />
        )}
      />
      {sex === 'MACHO' && <BullSection control={control} />}
      {parentButton('sire')}
      {parentButton('dam')}
    </Section>
  );

  const reproduction = (
    <Section title={t('animalForm.sections.reproduction')}>
      <FormField
        control={control}
        name="lastCalvingDate"
        render={(field) => (
          <DateField
            {...field}
            maxDate="today"
            label={t('animalForm.fields.lastCalving')}
            className="col-span-2"
          />
        )}
      />
      <FormField
        control={control}
        name="lactationNumber"
        render={(field) => (
          <NumberField
            {...field}
            maxLength={2}
            placeholder="1"
            label={t('animalForm.fields.lactation')}
            className="col-span-2"
          />
        )}
      />
      <FormField
        control={control}
        name="reproStage"
        render={(field) => (
          <Select
            {...field}
            label={t('animalForm.fields.reproStage')}
            options={reproOptions(t)}
            className="col-span-2"
          />
        )}
      />
      <FormField
        control={control}
        name="reproStageDate"
        render={(field) => (
          <DateField
            {...field}
            maxDate="today"
            disabled={reproStage === NO_REPRO_STAGE}
            label={t('animalForm.fields.reproStageDate')}
            className="col-span-2"
          />
        )}
      />
    </Section>
  );

  const weights = (
    <Section title={t('animalForm.sections.weights')}>
      <div className="col-span-2 grid grid-cols-3 gap-3">
        {(['weightBirth', 'weightWeaning', 'weightOneYear'] as const).map((name) => (
          <FormField
            key={name}
            control={control}
            name={name}
            render={(field) => (
              <NumberField
                {...field}
                decimals={1}
                maxLength={6}
                unit="kg"
                placeholder="0.0"
                label={t(`animalForm.fields.${name}`)}
              />
            )}
          />
        ))}
      </div>
    </Section>
  );

  return (
    <form noValidate onSubmit={(event) => void submit(event)} className="flex flex-col gap-4">
      <FormField
        control={control}
        name="sex"
        render={(field) => (
          <RadioGroup
            {...field}
            onChange={(value) => changeSex(value as Sex)}
            label={t('animalForm.fields.sex')}
            variant="card"
            orientation="horizontal"
            className="[&_[role=radiogroup]>*]:flex-1"
            options={[
              { value: 'MACHO', label: t('animalForm.sex.MACHO'), icon: iconBull },
              { value: 'HEMBRA', label: t('animalForm.sex.HEMBRA'), icon: iconCow },
            ]}
          />
        )}
      />
      {formError && <Banner tone="error">{formError}</Banner>}
      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col gap-4">
          {general}
          {detailed && additional}
        </div>
        {detailed && (
          <div className="flex flex-col gap-4">
            {repro && reproduction}
            {weights}
          </div>
        )}
      </div>
      <Button
        type="submit"
        size="lg"
        fullWidth
        loading={create.isPending && !pending}
        className="lg:ml-auto lg:w-64"
      >
        {t('animalForm.submit')}
      </Button>

      {(['dam', 'sire'] as const).map((slot) => (
        <ParentDialog
          key={slot}
          slot={slot}
          open={dialog === slot}
          value={parents[slot]}
          error={parentErrors[slot]}
          onOpenChange={(open) => setDialog(open ? slot : null)}
          onSave={(choice) => saveParent(slot, choice)}
        />
      ))}
      <DamStatusDialog
        open={pending !== null}
        damId={parents.dam ? parentLabel(parents.dam) : ''}
        saving={create.isPending}
        // A baja of the dam needs the delete permission (§7.8).
        canRemove={can('ANIMALS_DELETE')}
        onCancel={() => setPending(null)}
        onConfirm={(status) => pending && send(pending, status)}
      />
    </form>
  );
}
