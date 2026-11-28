import { useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UNSAFE_DataRouterContext, useBlocker } from 'react-router-dom';

import { useIsDesktop } from '../../app/useIsDesktop';
import { Banner } from '../../ui/Banner';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { Modal } from '../../ui/Modal';
import { Spinner } from '../../ui/Spinner';
import { useAnimal, type AnimalDetail } from '../animals/profile/api';
import type { EventKind } from './eventTypes';
import { EVENT_FLOWS, type EventFlow } from './flows';
import { useRecordEvent } from './useRecordEvent';

interface EventWizardProps {
  animalId: string;
  kind: EventKind;
  /** Opened from a task: the snackbar names the animal. */
  fromTask?: boolean;
  /** `recorded` is true once the event was saved. Also called when a save started before the form
   * was closed ends: true if it was saved, false if it failed. */
  onClose: (recorded: boolean) => void;
  /** Told when a save starts and ends, so whoever closes the form mid-save can wait for it. */
  onSavingChange?: (saving: boolean) => void;
  /** The flow to run; by default the registered one for `kind`. */
  flow?: EventFlow;
}

function DiscardDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  return (
    <ConfirmDialog
      danger
      open={open}
      onOpenChange={onOpenChange}
      title={t('ui.discardTitle')}
      description={t('ui.discardBody')}
      confirmLabel={t('ui.discardConfirm')}
      cancelLabel={t('ui.keepEditing')}
      onConfirm={onConfirm}
    />
  );
}

/** Leaving the page (a phone's back gesture, a link) with data entered asks first too. Only in
 * the app's data router: `useBlocker` throws anywhere else. */
function LeaveGuard({ when, onLeave }: { when: boolean; onLeave: () => void }) {
  const blocker = useBlocker(when);
  return (
    <DiscardDialog
      open={blocker.state === 'blocked'}
      onOpenChange={(open) => {
        if (!open) blocker.reset?.();
      }}
      onConfirm={() => {
        blocker.proceed?.();
        onLeave();
      }}
    />
  );
}

function FlowBody({
  animal,
  kind,
  flow,
  fromTask,
  onClose,
  setDirty,
  requestClose,
  setBusy,
}: {
  animal: AnimalDetail;
  kind: EventKind;
  flow: EventFlow;
  fromTask: boolean;
  onClose: (recorded: boolean) => void;
  setDirty: (dirty: boolean) => void;
  requestClose: () => void;
  setBusy: (busy: boolean) => void;
}) {
  const mounted = useRef(false);
  // Set in the effect, not the initial value: StrictMode runs the cleanup once on mount.
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  // Set on the tap itself: `isPending` only shows on the next render, too late for a double tap.
  const inFlight = useRef(false);
  const save = useRecordEvent(animal, kind, {
    fromTask,
    // Hook-level callbacks: they still run if the page changed mid-save, so the opener (a task)
    // hears that the event was recorded.
    onRecorded: () => {
      inFlight.current = false;
      setBusy(false);
      onClose(true);
    },
    onFailed: () => {
      inFlight.current = false;
      setBusy(false);
      // Still open: the user can try again. Already closed: nothing was recorded.
      if (!mounted.current) onClose(false);
    },
  });
  return (
    <flow.Component
      animal={animal}
      record={(body) => {
        if (inFlight.current) return;
        inFlight.current = true;
        setBusy(true);
        save.mutate(body);
      }}
      recording={save.isPending}
      setDirty={setDirty}
      cancel={requestClose}
    />
  );
}

/**
 * The shell every event form runs in (event-flows 1.0): a modal on the web (W frames) and a
 * full-screen page on phones, which have no event frames of their own. It owns the title, the
 * "lose your data?" guard and the save (snackbar + refresh, via useRecordEvent); a flow only
 * draws its steps. See README.md in this folder.
 */
export function EventWizard({
  animalId,
  kind,
  fromTask = false,
  onClose,
  onSavingChange,
  flow = EVENT_FLOWS[kind],
}: EventWizardProps) {
  const { t } = useTranslation();
  const desktop = useIsDesktop();
  const animal = useAnimal(animalId);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusyState] = useState(false);
  const setBusy = (next: boolean) => {
    setBusyState(next);
    onSavingChange?.(next);
  };
  const [confirming, setConfirming] = useState(false);
  const inDataRouter = useContext(UNSAFE_DataRouterContext) !== null;

  const requestClose = () => {
    if (busy) return;
    if (dirty) setConfirming(true);
    else onClose(false);
  };

  return (
    <>
      <Modal
        open
        fullScreen={!desktop}
        onOpenChange={(open) => {
          if (!open) requestClose();
        }}
        title={t(flow?.titleKey ?? `events.kinds.${kind}`)}
      >
        {!flow ? (
          <Banner tone="info">{t('events.reasons.soon')}</Banner>
        ) : animal.data ? (
          <FlowBody
            animal={animal.data}
            kind={kind}
            flow={flow}
            fromTask={fromTask}
            onClose={onClose}
            setDirty={setDirty}
            requestClose={requestClose}
            setBusy={setBusy}
          />
        ) : animal.isError ? (
          <Banner tone="error">{t('profile.loadError')}</Banner>
        ) : (
          <div className="flex justify-center p-8">
            <Spinner size={32} />
          </div>
        )}
      </Modal>
      <DiscardDialog
        open={confirming}
        onOpenChange={setConfirming}
        onConfirm={() => {
          setConfirming(false);
          onClose(false);
        }}
      />
      {inDataRouter && <LeaveGuard when={dirty} onLeave={() => onClose(false)} />}
    </>
  );
}
