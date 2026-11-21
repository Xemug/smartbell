import { useTranslation } from 'react-i18next';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';

import { useActiveRanch } from '../../../app/useActiveRanch';
import { cx, focusRing } from '../../../ui/cx';
import { iconArrowLeft } from '../../../ui/icons/glyphs';
import { Icon } from '../../../ui/icons/Icon';
import { ANIMALS_PATH } from '../list/AnimalListPage';
import type { AnimalCreated } from './api';
import { AnimalForm } from './AnimalForm';

/** The list that shows the new animal. Calves and steers have none yet: back where they came from. */
function listOf(created: AnimalCreated, back: string): string {
  if (created.kind === 'VACA') return ANIMALS_PATH;
  if (created.kind === 'VAQUILLA') return `${ANIMALS_PATH}?tipo=vaquillas`;
  if (created.kind === 'TORO') return `${ANIMALS_PATH}?tipo=toros`;
  return back;
}

/** /vacas/nueva: the list's "Agregar" button opens it; `?tipo=toros` starts on Macho. */
export function NewAnimalPage() {
  const { t } = useTranslation();
  const { can } = useActiveRanch();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const kind = params.get('tipo');
  const back =
    kind === 'toros' || kind === 'vaquillas' ? `${ANIMALS_PATH}?tipo=${kind}` : ANIMALS_PATH;

  if (!can('ANIMALS_CREATE')) return <Navigate to={back} replace />;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4">
      <Link
        to={back}
        className={cx('inline-flex w-fit items-center gap-1 text-primary type-label-md', focusRing)}
      >
        <Icon icon={iconArrowLeft} size={16} />
        {t('animalForm.back')}
      </Link>
      <h1 className="ramp-page-title text-primary">{t('animalForm.title')}</h1>
      <AnimalForm
        initialSex={kind === 'toros' ? 'MACHO' : 'HEMBRA'}
        onCreated={(created) => navigate(listOf(created, back))}
      />
    </div>
  );
}
