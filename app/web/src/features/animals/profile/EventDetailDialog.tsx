import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useActiveRanch } from '../../../app/useActiveRanch';
import { Banner } from '../../../ui/Banner';
import { Button } from '../../../ui/Button';
import { ConfirmDialog } from '../../../ui/ConfirmDialog';
import { cx, focusRing } from '../../../ui/cx';
import { toDisplay } from '../../../ui/dates';
import { iconPencil, iconTrash } from '../../../ui/icons/glyphs';
import { Modal } from '../../../ui/Modal';
import { TextArea } from '../../../ui/TextArea';
import { useSnackbar } from '../../../ui/useSnackbar';
import { useGroupList } from '../../groups/api';
import { groupName } from '../../groups/labels';
import { ANIMALS_PATH } from '../list/AnimalListPage';
import {
  useAnimal,
  useDeleteEvent,
  useEditEventComments,
  type AnimalDetail,
  type AnimalEvent,
} from './api';
import { useEventText } from './eventText';
import { categoryOf, treatmentOf, type Treatment } from './profileFacts';

const COMMENT_MAX = 160;

/** The expandable "Tratamiento médico" block of a medicated event (event-flows 1.9). */
function TreatmentBlock({ treatment }: { treatment: Treatment }) {
  const { t } = useTranslation();
  const days = (count: number) => t('profile.treatment.days', { count });
  const type = t(`profile.treatment.types.${treatment.type}`);
  const rows: [string, string][] = [
    [
      t('profile.treatment.tipo'),
      treatment.corticoidSubtype
        ? `${type} (${t(`profile.treatment.corticoids.${treatment.corticoidSubtype}`)})`
        : type,
    ],
    [
      t('profile.treatment.presentacion'),
      treatment.presentation ? t(`profile.treatment.presentations.${treatment.presentation}`) : '',
    ],
    [t('profile.treatment.inicio'), toDisplay(treatment.startDate)],
    [t('profile.treatment.duracion'), days(treatment.durationDays)],
    [
      t('profile.treatment.fuera'),
      treatment.withdrawalDays == null
        ? t('profile.treatment.defaultWithdrawal')
        : days(treatment.withdrawalDays),
    ],
  ];
  return (
    <details className="mt-3 rounded-moon-i-xs border p-3" open>
      <summary className="cursor-pointer text-primary type-label-md">
        {t('profile.treatment.title')}
      </summary>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 type-body-md">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-secondary-text type-label-md">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

interface EventDetailDialogProps {
  animal: AnimalDetail;
  /** The event shown; null keeps the dialog closed. */
  event: AnimalEvent | null;
  onClose: () => void;
}

/**
 * Event detail (mobile-core B5, event-flows 1.9). Repro, alta and baja events are locked: they
 * show no Eliminar. Without ANIMALS_DELETE, Eliminar files a request an admin approves (202).
 */
export function EventDetailDialog({ animal, event, onClose }: EventDetailDialogProps) {
  const { t } = useTranslation();
  const { can } = useActiveRanch();
  const text = useEventText();
  const { show } = useSnackbar();
  const remove = useDeleteEvent(animal.id);
  const edit = useEditEventComments(animal.id);
  const [editing, setEditing] = useState(false);
  const [comments, setComments] = useState('');
  const [confirming, setConfirming] = useState(false);
  // A service names the bull (IA or monta): show who, linked to his profile.
  const service =
    event?.type === 'HEAT' && typeof event.payload.bull_id === 'string'
      ? { bullId: event.payload.bull_id, method: String(event.payload.method ?? '') }
      : null;
  const bull = useAnimal(service?.bullId);
  // A potrero change names where she came from and where she went.
  const move = event?.type === 'GROUP_CHANGE' ? event.payload : null;
  const groups = useGroupList();

  useEffect(() => {
    setEditing(false);
    setConfirming(false);
    setComments(event?.comments ?? '');
  }, [event]);

  if (!event) return null;
  /** No group yet is General. A potrero deleted since shows the name the API kept for it. */
  const potrero = (id: unknown, kept: unknown) => {
    const list = groups.data ?? [];
    const group =
      typeof id === 'string'
        ? list.find((g) => g.id === id)
        : list.find((g) => g.preset === 'GENERAL');
    if (group) return groupName(group, t);
    if (groups.isPending) return '…';
    return typeof kept === 'string'
      ? t('profile.detail.deletedPotreroNamed', { name: kept })
      : t('profile.detail.deletedPotrero');
  };
  const treatment = treatmentOf(event);
  const recorder = can('EVENTS_RECORD') && animal.status === 'ACTIVE';
  // Only events the API lets anyone edit: the deletable kinds (repro edits are admins' only).
  const editable = recorder && event.deletable;
  const deletable = recorder && event.deletable;

  const save = () =>
    edit.mutate(
      { eventId: event.id, comments: comments.trim() || null },
      {
        onSuccess: () => {
          show({ kind: 'success', message: t('profile.detail.saved') });
          onClose();
        },
        onError: () => show({ kind: 'error', message: t('profile.detail.saveError') }),
      },
    );

  const confirmDelete = () =>
    remove.mutate(event.id, {
      onSuccess: (outcome) => {
        show(
          outcome === 'deleted'
            ? { kind: 'deleted', message: t('profile.deleteEvent.done') }
            : { kind: 'success', message: t('profile.deleteEvent.requested') },
        );
        setConfirming(false);
        onClose();
      },
      onError: () => {
        setConfirming(false);
        show({ kind: 'error', message: t('profile.deleteEvent.error') });
      },
    });

  const rows: [string, ReactNode][] = [
    [t('profile.detail.tipoRegistro'), t(`profile.categories.${categoryOf(event)}`)],
    [t('profile.detail.fecha'), toDisplay(event.occurred_on)],
    [t('profile.detail.tipoEvento'), text(event)],
    ...(service
      ? ([
          [
            t('profile.detail.toro'),
            <Link
              key="toro"
              to={`${ANIMALS_PATH}/${service.bullId}`}
              className={cx('text-primary underline', focusRing)}
            >
              {bull.data
                ? [bull.data.control_id, bull.data.name].filter(Boolean).join(' · ')
                : t('profile.cards.noRecord')}
            </Link>,
          ],
          [t('profile.detail.metodo'), t(`profile.services.methods.${service.method}`)],
        ] as [string, ReactNode][])
      : []),
    ...(move
      ? ([
          [t('profile.detail.dePotrero'), potrero(move.from_group_id, move.from_group_name)],
          [t('profile.detail.aPotrero'), potrero(move.to_group_id, move.to_group_name)],
        ] as [string, ReactNode][])
      : []),
    [t('profile.detail.realizo'), event.recorded_by_name || t('profile.detail.unknownUser')],
  ];

  return (
    <>
      <Modal
        open={!confirming}
        onOpenChange={(open) => {
          if (!open && !edit.isPending) onClose();
        }}
        title={t('profile.detail.title')}
        footer={
          editing ? (
            <Button disabled={comments.trim() === ''} loading={edit.isPending} onClick={save}>
              {t('profile.detail.guardar')}
            </Button>
          ) : (
            <>
              {deletable && (
                <Button
                  variant="danger"
                  leadingIcon={iconTrash}
                  onClick={() => setConfirming(true)}
                >
                  {t('profile.detail.eliminar')}
                </Button>
              )}
              {editable && (
                <Button variant="outline" leadingIcon={iconPencil} onClick={() => setEditing(true)}>
                  {t('profile.detail.editar')}
                </Button>
              )}
            </>
          )
        }
      >
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 type-body-md">
          {rows.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-secondary-text type-label-md">{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
          {!editing && (
            <div className="contents">
              <dt className="text-secondary-text type-label-md">
                {t('profile.detail.comentarios')}
              </dt>
              <dd className="whitespace-pre-wrap">
                {event.comments || t('profile.detail.sinComentarios')}
              </dd>
            </div>
          )}
        </dl>
        {treatment && <TreatmentBlock treatment={treatment} />}
        {editing && (
          <TextArea
            label={t('profile.detail.comentarios')}
            hint={`${comments.length}/${COMMENT_MAX}`}
            placeholder={t('profile.detail.placeholder')}
            value={comments}
            maxLength={COMMENT_MAX}
            onChange={(e) => setComments(e.target.value)}
          />
        )}
        {!event.deletable && (
          <Banner tone="info" className="mt-3">
            {t('profile.detail.locked')}
          </Banner>
        )}
      </Modal>
      <ConfirmDialog
        open={confirming}
        onOpenChange={(open) => {
          if (!open && !remove.isPending) setConfirming(false);
        }}
        title={t('profile.deleteEvent.title')}
        description={t('profile.deleteEvent.body')}
        confirmLabel={t('profile.deleteEvent.confirm')}
        onConfirm={confirmDelete}
        danger
        loading={remove.isPending}
      />
    </>
  );
}
