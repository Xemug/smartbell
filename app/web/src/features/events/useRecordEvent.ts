import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { api } from '../../api/client';
import type { components } from '../../api/schema';
import { useSnackbar } from '../../ui/useSnackbar';
import { animalKeys, ApiError } from '../animals/list/api';
import type { AnimalDetail } from '../animals/profile/api';
import { EVENT_ICONS, recordedKey, type EventKind } from './eventTypes';

export type EventCreate = components['schemas']['EventCreate'];

interface Options {
  /** Opened from a task or alert: the snackbar names the animal, as there is no profile behind. */
  fromTask?: boolean;
  /** After the snackbar and the refresh. Runs even if the form was closed meanwhile. */
  onRecorded?: () => void;
  /** After the error snackbar. Runs even if the form was closed meanwhile. */
  onFailed?: () => void;
}

/**
 * Records one event for an animal: the POST, then the confirmation snackbar (event-flows 1.11,
 * also on phones) and a refresh of everything that shows the animal. A failure shows the
 * connection-error snackbar and leaves the form as it was, so the user can try again.
 */
export function useRecordEvent(
  animal: AnimalDetail,
  kind: EventKind,
  { fromTask, onRecorded, onFailed }: Options = {},
) {
  const { t } = useTranslation();
  const snackbar = useSnackbar();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: EventCreate) => {
      const { data, error, response } = await api.POST('/api/animals/{animal_id}/events', {
        params: { path: { animal_id: animal.id } },
        body,
      });
      if (!data) {
        const detail = (error as { detail?: unknown } | undefined)?.detail;
        throw new ApiError(typeof detail === 'string' ? detail : `http_${response.status}`);
      }
      return data;
    },
    onSuccess: async () => {
      const what = t(`events.recorded.${recordedKey(kind)}`);
      snackbar.show({
        kind: 'success',
        icon: EVENT_ICONS[kind],
        message: fromTask
          ? t('events.recordedFor', {
              kind: t(`profile.kinds.${animal.kind}`),
              id: animal.control_id,
              what: what.toLowerCase(),
            })
          : what,
      });
      // Her profile and bitácora, the lists that show her state, and the potreros (a health
      // event can move her to Enfermas).
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: animalKeys.all }),
        queryClient.invalidateQueries({ queryKey: animalKeys.groups }),
      ]);
      onRecorded?.();
    },
    onError: () => {
      snackbar.show({ kind: 'error', message: t('events.connectionError') });
      onFailed?.();
    },
  });
}
