import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useActiveRanch } from '../../../app/useActiveRanch';
import { Banner } from '../../../ui/Banner';
import { Button } from '../../../ui/Button';
import { ConfirmDialog } from '../../../ui/ConfirmDialog';
import { toDisplay } from '../../../ui/dates';
import { iconPencil, iconTrash } from '../../../ui/icons/glyphs';
import { Modal } from '../../../ui/Modal';
import { TextArea } from '../../../ui/TextArea';
import { useSnackbar } from '../../../ui/useSnackbar';
import { useDeleteEvent, useEditEventComments, type AnimalDetail, type AnimalEvent } from './api';
import { useEventText } from './eventText';
import { categoryOf } from './profileFacts';

const COMMENT_MAX = 160;

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

  useEffect(() => {
    setEditing(false);
    setConfirming(false);
    setComments(event?.comments ?? '');
  }, [event]);

  if (!event) return null;
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

  const rows: [string, string][] = [
    [t('profile.detail.tipoRegistro'), t(`profile.categories.${categoryOf(event)}`)],
    [t('profile.detail.fecha'), toDisplay(event.occurred_on)],
    [t('profile.detail.tipoEvento'), text(event)],
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
