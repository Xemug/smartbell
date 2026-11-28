import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useActiveRanch } from '../../app/useActiveRanch';
import { Banner } from '../../ui/Banner';
import { Card } from '../../ui/Card';
import { TextArea } from '../../ui/TextArea';
import { TextField } from '../../ui/TextField';
import { Wizard } from '../../ui/Wizard';
import { useCreateGroup } from './api';
import { CowPicker } from './CowPicker';
import { BULL_GROUPS_PATH, groupPath } from './labels';

const NAME_MAX = 60;
const DESCRIPTION_MAX = 120;

/** A new bull group: Datos generales → Selección de toros. Bull groups are picked by hand and
 * have no indicator, so the cow wizard's AUTO rule and indicator steps are left out. */
export function NewBullGroupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { can } = useActiveRanch();
  const create = useCreateGroup();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameMissing = name.trim() === '';
  const stepValid = step === 0 ? !nameMissing : true;
  const dirty = name !== '' || description !== '' || picked.length > 0;

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
        type: 'TORO',
        name: name.trim(),
        description: description.trim() || null,
        selection: 'MANUAL',
        animal_ids: picked,
        kpi_indicator: null,
      },
      {
        onSuccess: (group) =>
          navigate(groupPath(group.id), { replace: true, state: { created: true } }),
        onError: (failure) =>
          setError(
            failure.message === 'group_name_taken'
              ? t('groups.detail.nameTaken')
              : failure.message === 'bull_semen_only'
                ? t('groups.bulls.semenOnly')
                : t('groups.wizard.error'),
          ),
      },
    );
  };

  const next = () => {
    setTouched(true);
    if (!stepValid) return;
    setTouched(false);
    if (step < 1) setStep(step + 1);
    else finish();
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4">
      <h1 className="text-center ramp-page-title text-primary">{t('groups.bulls.wizardTitle')}</h1>
      <Card>
        <Wizard
          steps={[t('groups.wizard.steps.general'), t('groups.bulls.pickStep')]}
          step={step}
          dirty={dirty}
          onNext={next}
          onBack={() => (step === 0 ? navigate(BULL_GROUPS_PATH) : setStep(step - 1))}
          finishLabel={t('groups.bulls.finish')}
          nextLoading={create.isPending}
          nextDisabled={touched && !stepValid}
        >
          {error && (
            <Banner tone="error" onClose={() => setError(null)} className="mb-4">
              {error}
            </Banner>
          )}
          {step === 0 && (
            <div className="flex flex-col gap-4">
              <TextField
                label={t('groups.wizard.name')}
                required
                placeholder={t('groups.bulls.namePlaceholder')}
                maxLength={NAME_MAX}
                hint={`${name.length}/${NAME_MAX}`}
                error={touched && nameMissing ? t('groups.wizard.nameRequired') : undefined}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
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
          {step === 1 && <CowPicker bulls selected={picked} onChange={setPicked} />}
        </Wizard>
      </Card>
    </div>
  );
}
