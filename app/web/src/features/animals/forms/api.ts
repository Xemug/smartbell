import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '../../../api/client';
import type { components } from '../../../api/schema';
import { animalKeys } from '../list/api';
import type { AnimalCreate, Sex } from './formModel';

export type AnimalCreated = components['schemas']['AnimalCreated'];
type Animal = components['schemas']['AnimalOut'];

interface Refusal {
  loc: unknown[];
  msg: string;
  type: string;
}

/** A refused create: field refusals when the API named fields, else its error code. */
export class CreateError extends Error {
  constructor(
    readonly code: string,
    readonly fields: Refusal[] = [],
  ) {
    super(code);
    this.name = 'CreateError';
  }
}

export function useCreateAnimal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: AnimalCreate) => {
      const { data, error, response } = await api.POST('/api/animals', { body });
      if (data) return data;
      const detail = (error as { detail?: unknown } | undefined)?.detail;
      if (Array.isArray(detail)) throw new CreateError('invalid', detail as Refusal[]);
      throw new CreateError(typeof detail === 'string' ? detail : `http_${response.status}`);
    },
    // Lists, counters and any parent picked by search change with the new animals.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: animalKeys.all }),
  });
}

/** Animals of one sex whose ID or name matches, for "Buscar" in the parent dialogs. */
export function useParentSearch(q: string, sex: Sex) {
  const term = q.trim();
  return useQuery({
    queryKey: [...animalKeys.all, 'parentSearch', sex, term] as const,
    enabled: term.length > 0,
    queryFn: async (): Promise<Animal[]> => {
      const { data, error, response } = await api.GET('/api/animals', {
        params: { query: { q: term, sex, page_size: 20 } },
      });
      if (!data) {
        const detail = (error as { detail?: unknown } | undefined)?.detail;
        throw new CreateError(typeof detail === 'string' ? detail : `http_${response.status}`);
      }
      return data.items;
    },
  });
}
