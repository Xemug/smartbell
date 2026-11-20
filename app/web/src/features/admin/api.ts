import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '../../api/client';
import type { components } from '../../api/schema';
import { supportConfigQuery, type SupportConfig } from '../../app/support';

export type SupportConfigIn = components['schemas']['SupportConfigIn'];
export type FakeDoorCount = components['schemas']['FakeDoorCount'];

/** A 422 the API refused per field, or anything else (403, offline). */
export class SaveError extends Error {
  constructor(readonly fields: (keyof SupportConfigIn)[]) {
    super(fields.length ? `invalid: ${fields.join(', ')}` : 'save failed');
  }
}

const configFields: (keyof SupportConfigIn)[] = [
  'whatsapp_number',
  'support_message',
  'payment_message',
  'feature_message',
  'community_url',
];

/** FastAPI's 422 says which body field failed in `loc`: ['body', 'community_url', ...]. */
function refusedFields(error: unknown): (keyof SupportConfigIn)[] {
  const detail = (error as { detail?: unknown } | undefined)?.detail;
  if (!Array.isArray(detail)) return [];
  const fields = detail
    .map((item) => (item as { loc?: unknown[] }).loc?.[1])
    .filter((field): field is keyof SupportConfigIn =>
      configFields.includes(field as keyof SupportConfigIn),
    );
  return [...new Set(fields)];
}

/**
 * The live config, from the same cache the app's support links read so a save shows everywhere.
 * Never stale here: the links cache it for minutes, and editing from an old copy would undo
 * another admin's change.
 */
export function useAdminSupportConfig() {
  return useQuery({ ...supportConfigQuery, staleTime: 0, refetchOnMount: 'always' });
}

export function useSaveSupportConfig() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (body: SupportConfigIn): Promise<SupportConfig> => {
      const { data, error } = await api.PUT('/api/admin/support/config', { body });
      if (!data) throw new SaveError(refusedFields(error));
      return data;
    },
    onSuccess: (saved) => client.setQueryData(supportConfigQuery.queryKey, saved),
  });
}

/** Taps per feature since `since` (an ISO instant), most wanted first. */
export function useFakeDoorReport(since: string) {
  return useQuery({
    queryKey: ['admin', 'fake-door-taps', since],
    queryFn: async () => {
      const { data } = await api.GET('/api/admin/fake-door-taps', {
        params: { query: { since } },
      });
      if (!data) throw new Error('fake-door report failed');
      return data;
    },
  });
}
