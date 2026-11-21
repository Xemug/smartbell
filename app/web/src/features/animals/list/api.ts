import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '../../../api/client';
import type { components } from '../../../api/schema';
import { LIST_KINDS, type ListKind, type ListQuery, type RemovalReason } from './listState';

export type Animal = components['schemas']['AnimalOut'];
export type Group = components['schemas']['GroupOut'];

/** The API's error code (`detail`), or `http_<status>` when it sent none. */
export class ApiError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = 'ApiError';
  }
}

function fail(error: unknown, response: Response): never {
  const detail = (error as { detail?: unknown } | undefined)?.detail;
  throw new ApiError(typeof detail === 'string' ? detail : `http_${response.status}`);
}

export const animalKeys = {
  all: ['animals'] as const,
  list: (query: ListQuery) => ['animals', 'list', query] as const,
  count: (kind: ListKind) => ['animals', 'count', kind] as const,
  groups: ['groups'] as const,
};

/** One page of a list. The previous page stays on screen while the next one loads. */
export function useAnimalPage(query: ListQuery) {
  return useQuery({
    queryKey: animalKeys.list(query),
    queryFn: async () => {
      const { data, error, response } = await api.GET('/api/animals', { params: { query } });
      if (!data) fail(error, response);
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

/** How many active animals a list holds, for its counter. */
export function useKindCount(kind: ListKind) {
  return useQuery({
    queryKey: animalKeys.count(kind),
    queryFn: async () => {
      const { data, error, response } = await api.GET('/api/animals', {
        params: { query: { kind: LIST_KINDS[kind], page_size: 1 } },
      });
      if (!data) fail(error, response);
      return data.total;
    },
  });
}

export function useGroups() {
  return useQuery({
    queryKey: animalKeys.groups,
    queryFn: async () => {
      const { data, error, response } = await api.GET('/api/groups');
      if (!data) fail(error, response);
      return data;
    },
  });
}

export interface RemovalResult {
  removed: string[];
  failed: { id: string; code: string }[];
}

/**
 * Baja of each animal, one request each so one refusal (an animal in use, say) doesn't stop the
 * rest. Resolves with what went through and what didn't.
 */
export function useRemoveAnimals() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      ids,
      reason,
    }: {
      ids: string[];
      reason: RemovalReason;
    }): Promise<RemovalResult> => {
      const result: RemovalResult = { removed: [], failed: [] };
      for (const id of ids) {
        const { error, response } = await api.POST('/api/animals/{animal_id}/removal', {
          params: { path: { animal_id: id } },
          body: { reason },
        });
        if (response.ok) {
          result.removed.push(id);
        } else {
          const detail = (error as { detail?: unknown } | undefined)?.detail;
          result.failed.push({
            id,
            code: typeof detail === 'string' ? detail : `http_${response.status}`,
          });
        }
      }
      return result;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: animalKeys.all }),
  });
}
