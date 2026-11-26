import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '../../api/client';
import type { components } from '../../api/schema';
import { ApiError, animalKeys } from '../animals/list/api';

export type GroupOut = components['schemas']['GroupOut'];
export type GroupCreate = components['schemas']['GroupCreate'];
export type GroupUpdate = components['schemas']['GroupUpdate'];
export type AutoFilter = components['schemas']['AutoFilter'];
export type HeiferGroup = components['schemas']['HeiferGroupOut'];
export type KpiIndicator = components['schemas']['GroupKpiIndicator'];
export type GroupPreset = components['schemas']['GroupPreset'];

/** The API's error code: `detail` when it's a string, the first field error's type otherwise. */
function fail(error: unknown, response: Response): never {
  const detail = (error as { detail?: unknown } | undefined)?.detail;
  if (typeof detail === 'string') throw new ApiError(detail);
  if (Array.isArray(detail) && typeof detail[0]?.type === 'string') {
    throw new ApiError(detail[0].type as string);
  }
  throw new ApiError(`http_${response.status}`);
}

export const groupKeys = {
  // The animal lists read the same list to name each animal's group.
  all: animalKeys.groups,
  one: (id: string) => [...animalKeys.groups, 'one', id] as const,
  heifers: [...animalKeys.groups, 'heifers'] as const,
  preview: (rule: AutoFilter) => [...animalKeys.groups, 'preview', rule] as const,
};

export function useGroupList() {
  return useQuery({
    queryKey: groupKeys.all,
    queryFn: async () => {
      const { data, error, response } = await api.GET('/api/groups');
      if (!data) fail(error, response);
      return data;
    },
  });
}

export function useGroup(id: string) {
  return useQuery({
    queryKey: groupKeys.one(id),
    queryFn: async () => {
      const { data, error, response } = await api.GET('/api/groups/{group_id}', {
        params: { path: { group_id: id } },
      });
      if (!data) fail(error, response);
      return data;
    },
  });
}

export function useHeiferGroups() {
  return useQuery({
    queryKey: groupKeys.heifers,
    queryFn: async () => {
      const { data, error, response } = await api.GET('/api/groups/heifers');
      if (!data) fail(error, response);
      return data;
    },
  });
}

/** The cows an AUTO rule matches today; off until the rule has a value. */
export function useAutoPreview(rule: AutoFilter | null) {
  return useQuery({
    queryKey: groupKeys.preview(rule ?? { field: 'AGE', values: [] }),
    enabled: rule !== null && rule.values.length > 0,
    queryFn: async () => {
      if (!rule) return [];
      const { data, error, response } = await api.POST('/api/groups/preview', { body: rule });
      if (!data) fail(error, response);
      return data;
    },
  });
}

/** Every write moves animals or renames a group, so both lists go stale. */
function useInvalidate() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: animalKeys.all }),
      queryClient.invalidateQueries({ queryKey: groupKeys.all }),
    ]);
}

export function useCreateGroup() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (body: GroupCreate) => {
      const { data, error, response } = await api.POST('/api/groups', { body });
      if (!data) fail(error, response);
      return data;
    },
    onSettled: invalidate,
  });
}

export function useUpdateGroup(id: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (body: GroupUpdate) => {
      const { data, error, response } = await api.PATCH('/api/groups/{group_id}', {
        params: { path: { group_id: id } },
        body,
      });
      if (!data) fail(error, response);
      return data;
    },
    onSettled: invalidate,
  });
}

export function useDeleteGroup() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, toGroupId }: { id: string; toGroupId: string | null }) => {
      const { data, error, response } = await api.DELETE('/api/groups/{group_id}', {
        params: { path: { group_id: id }, query: toGroupId ? { to_group_id: toGroupId } : {} },
      });
      if (!data) fail(error, response);
      return data;
    },
    onSettled: invalidate,
  });
}

export function useMoveAnimals() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ groupId, animalIds }: { groupId: string; animalIds: string[] }) => {
      const { data, error, response } = await api.POST('/api/groups/{group_id}/animals', {
        params: { path: { group_id: groupId } },
        body: { animal_ids: animalIds },
      });
      if (!data) fail(error, response);
      return data;
    },
    onSettled: invalidate,
  });
}

export function useReevaluate(id: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async () => {
      const { data, error, response } = await api.POST('/api/groups/{group_id}/reevaluate', {
        params: { path: { group_id: id } },
      });
      if (!data) fail(error, response);
      return data;
    },
    onSettled: invalidate,
  });
}
