import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState, type FormEvent } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button } from '../../../ui/Button';
import { cx, focusRing } from '../../../ui/cx';
import { DateField } from '../../../ui/DateField';
import { FormField } from '../../../ui/FormField';
import { iconSearch } from '../../../ui/icons/glyphs';
import { Modal } from '../../../ui/Modal';
import { Select } from '../../../ui/Select';
import { Spinner } from '../../../ui/Spinner';
import { TextField } from '../../../ui/TextField';
import { useParentSearch } from './api';
import type { Breed, CrossbreedLevel, ParentChoice } from './formModel';
import { breedOptions, crossbreedOptions } from './options';

const parentSchema = z
  .object({
    controlId: z.string().trim().min(1, 'validation.required').max(60),
    birthDate: z.string().trim().min(1, 'validation.required'),
    breed: z.string(),
    crossbreedLevel: z.string(),
    contributingBreed: z.string(),
    siniiga: z.string().trim(),
  })
  .superRefine((values, ctx) => {
    if (values.crossbreedLevel !== 'FB' && !values.contributingBreed) {
      ctx.addIssue({ code: 'custom', path: ['contributingBreed'], message: 'validation.required' });
    }
  });
type ParentValues = z.infer<typeof parentSchema>;

const emptyParent: ParentValues = {
  controlId: '',
  birthDate: '',
  breed: 'HOLSTEIN',
  crossbreedLevel: 'FB',
  contributingBreed: '',
  siniiga: '',
};

function initialValues(choice: ParentChoice | null): ParentValues {
  if (choice?.kind !== 'new') return emptyParent;
  const body = choice.body;
  return {
    controlId: body.control_id,
    birthDate: body.birth_date,
    breed: body.breed ?? 'HOLSTEIN',
    crossbreedLevel: body.crossbreed_level ?? 'FB',
    contributingBreed: body.contributing_breed ?? '',
    siniiga: body.siniiga ?? '',
  };
}

/**
 * "Datos de la Vaca Madre" / "Datos del Toro Padre" (v4 §1.4–1.5): find the parent by ID, or
 * type a new one that is registered together with the animal.
 */
export function ParentDialog({
  slot,
  open,
  value,
  error,
  onOpenChange,
  onSave,
}: {
  slot: 'dam' | 'sire';
  open: boolean;
  value: ParentChoice | null;
  /** A refusal the API sent about this parent on the last Registrar. */
  error?: string | null;
  onOpenChange: (open: boolean) => void;
  onSave: (choice: ParentChoice | null) => void;
}) {
  const { t } = useTranslation();
  const sex = slot === 'dam' ? 'HEMBRA' : 'MACHO';
  const [search, setSearch] = useState('');
  const [term, setTerm] = useState('');
  const results = useParentSearch(term, sex);
  const { control, handleSubmit, reset } = useForm<ParentValues>({
    resolver: zodResolver(parentSchema),
    defaultValues: initialValues(value),
  });
  const level = useWatch({ control, name: 'crossbreedLevel' });

  // Each opening starts from what the slot holds now.
  useEffect(() => {
    if (!open) return;
    reset(initialValues(value));
    setSearch(value?.kind === 'existing' ? value.controlId : '');
    setTerm('');
  }, [open, value, reset]);

  const runSearch = (event: FormEvent) => {
    event.preventDefault();
    event.stopPropagation(); // The dialog is portaled, but React still bubbles to the page's form.
    setTerm(search);
  };

  const register = (event: FormEvent<HTMLFormElement>) => {
    event.stopPropagation();
    void handleSubmit((values) => {
      onSave({
        kind: 'new',
        body: {
          control_id: values.controlId.trim(),
          birth_date: values.birthDate,
          breed: values.breed as Breed,
          crossbreed_level: values.crossbreedLevel as CrossbreedLevel,
          contributing_breed:
            values.crossbreedLevel === 'FB' ? null : (values.contributingBreed as Breed),
          siniiga: values.siniiga || null,
          development_stage: 'AUTO',
        },
      });
    })(event);
  };

  const prefix = `animalForm.parents.${slot}`;
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={t(`${prefix}.title`)}>
      <div className="flex flex-col gap-4">
        {error && <p className="text-error type-body-sm">{error}</p>}
        <form noValidate onSubmit={runSearch} role="search" className="flex items-end gap-2">
          <TextField
            type="search"
            label={t('animalForm.parents.search')}
            placeholder={t(`${prefix}.searchPlaceholder`)}
            value={search}
            maxLength={60}
            onChange={(event) => setSearch(event.target.value)}
            className="min-w-0 flex-1"
          />
          <Button type="submit" variant="outline" leadingIcon={iconSearch}>
            {t('animalForm.parents.searchButton')}
          </Button>
        </form>
        {term && (
          <div aria-live="polite">
            {results.isFetching ? (
              <Spinner size={20} />
            ) : results.isError ? (
              <p className="text-error type-body-sm">{t('animalForm.parents.searchError')}</p>
            ) : results.data && results.data.length > 0 ? (
              <ul className="flex flex-col gap-1">
                {results.data.map((animal) => (
                  <li key={animal.id}>
                    <button
                      type="button"
                      onClick={() =>
                        onSave({ kind: 'existing', id: animal.id, controlId: animal.control_id })
                      }
                      className={cx(
                        'flex w-full items-center justify-between rounded-moon-i-sm border px-3 py-2 text-left hover:bg-neutral-2',
                        focusRing,
                      )}
                    >
                      <span className="type-label-md">{animal.control_id}</span>
                      <span className="text-secondary-text type-body-sm">
                        {[animal.name, t(`animals.values.raza.${animal.breed}`), animal.birth_date]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-secondary-text type-body-sm">
                {t(`${prefix}.notFound`, { term })}
              </p>
            )}
          </div>
        )}

        <form noValidate onSubmit={register} className="grid grid-cols-2 gap-3">
          <h3 className="col-span-2 text-primary type-label-lg">{t(`${prefix}.registerTitle`)}</h3>
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
            name="crossbreedLevel"
            render={(field) => (
              <Select
                {...field}
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
            name="siniiga"
            render={(field) => (
              <TextField
                {...field}
                autoComplete="off"
                inputMode="numeric"
                maxLength={20}
                label={t('animalForm.fields.siniiga')}
                placeholder="1012345678"
                className="col-span-2"
              />
            )}
          />
          <div className="col-span-2 flex flex-wrap justify-end gap-2 pt-2">
            {value && (
              <Button type="button" variant="ghost" onClick={() => onSave(null)}>
                {t('animalForm.parents.remove')}
              </Button>
            )}
            <Button type="submit">{t('animalForm.parents.register')}</Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
