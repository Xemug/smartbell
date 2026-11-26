import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '../../../api/client';
import type { components } from '../../../api/schema';
import { animalKeys, ApiError } from '../list/api';
import type { RemovalReason } from '../list/listState';

export type AnimalDetail = components['schemas']['AnimalDetail'];
export type AnimalEvent = components['schemas']['EventOut'];
export type CowMilk = components['schemas']['CowMilkStats'];

function fail(error: unknown, response: Response): never {
  const detail = (error as { detail?: unknown } | undefined)?.detail;
  throw new ApiError(typeof detail === 'string' ? detail : `http_${response.status}`);
}

export const profileKeys = {
  animal: (id: string) => ['animals', 'detail', id] as const,
  events: (id: string) => ['animals', 'events', id] as const,
  milk: (id: string) => ['animals', 'milk', id] as const,
};

export function useAnimal(id: string | undefined) {
  return useQuery({
    queryKey: profileKeys.animal(id ?? ''),
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error, response } = await api.GET('/api/animals/{animal_id}', {
        params: { path: { animal_id: id ?? '' } },
      });
      if (!data) fail(error, response);
      return data;
    },
  });
}

/** The bitácora, newest first. */
export function useAnimalEvents(id: string | undefined) {
  return useQuery({
    queryKey: profileKeys.events(id ?? ''),
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error, response } = await api.GET('/api/animals/{animal_id}/events', {
        params: { path: { animal_id: id ?? '' } },
      });
      if (!data) fail(error, response);
      return data;
    },
  });
}

/** Her litres, for the Lts promedio tile. Only asked for when the user may see reports. */
export function useCowMilk(id: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: profileKeys.milk(id ?? ''),
    enabled: Boolean(id) && enabled,
    queryFn: async () => {
      const { data, error, response } = await api.GET('/api/milk/cows/{animal_id}', {
        params: { path: { animal_id: id ?? '' } },
      });
      if (!data) fail(error, response);
      return data;
    },
  });
}

/** `deleted`: gone, the animal re-projected. `requested`: sent to an admin for approval. */
export type DeleteOutcome = 'deleted' | 'requested';

export function useDeleteEvent(animalId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (eventId: string): Promise<DeleteOutcome> => {
      const { error, response } = await api.DELETE('/api/animals/{animal_id}/events/{event_id}', {
        params: { path: { animal_id: animalId, event_id: eventId } },
      });
      if (!response.ok) fail(error, response);
      return response.status === 202 ? 'requested' : 'deleted';
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: animalKeys.all }),
  });
}

/** Drops a deleted animal's cached profile, so going back to it can't show it again. */
export function useForgetAnimal() {
  const queryClient = useQueryClient();
  return (animalId: string) =>
    queryClient.removeQueries({
      queryKey: animalKeys.all,
      predicate: (query) => query.queryKey.includes(animalId),
    });
}

export function useEditEventComments(animalId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, comments }: { eventId: string; comments: string | null }) => {
      const { data, error, response } = await api.PATCH(
        '/api/animals/{animal_id}/events/{event_id}',
        {
          params: { path: { animal_id: animalId, event_id: eventId } },
          body: { comments },
        },
      );
      if (!data) fail(error, response);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: animalKeys.all }),
  });
}

/** Baja of one animal. Resolves true when the animal was deleted (Error al registrar). */
export function useRemoveAnimal(animalId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reason: RemovalReason): Promise<boolean> => {
      const { error, response } = await api.POST('/api/animals/{animal_id}/removal', {
        params: { path: { animal_id: animalId } },
        body: { reason },
      });
      if (!response.ok) fail(error, response);
      return response.status === 204;
    },
    // A deleted animal's own queries aren't refetched: they'd 404 and unmount the open profile,
    // and its success dialog with it. The page forgets them once it has left (`forgetAnimal`).
    onSuccess: (deleted) =>
      queryClient.invalidateQueries({
        queryKey: animalKeys.all,
        predicate: (query) => !deleted || !query.queryKey.includes(animalId),
      }),
  });
}
