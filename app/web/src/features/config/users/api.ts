import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '../../../api/client';
import type { components } from '../../../api/schema';

export type Member = components['schemas']['MemberOut'];
export type Invitation = components['schemas']['InvitationOut'];
export type InvitationCreated = components['schemas']['InvitationCreated'];
export type InvitationCreate = components['schemas']['InvitationCreate'];
export type InvitationPreview = components['schemas']['InvitationPreviewOut'];
export type MemberUpdate = components['schemas']['MemberUpdate'];
export type RolePreset = components['schemas']['RolePresetOut'];

/** The API's error code (`detail`), or `http_<status>` when it sent none. */
export class ApiError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

function fail(error: unknown, response: Response): never {
  const detail = (error as { detail?: unknown } | undefined)?.detail;
  throw new ApiError(typeof detail === 'string' ? detail : `http_${response.status}`);
}

export const usersKeys = {
  members: ['users', 'members'] as const,
  invitations: ['users', 'invitations'] as const,
  plan: ['users', 'plan'] as const,
  presets: ['users', 'presets'] as const,
};

export function usePlan() {
  return useQuery({
    queryKey: usersKeys.plan,
    queryFn: async () => {
      const { data, error, response } = await api.GET('/api/ranch/plan');
      if (!data) fail(error, response);
      return data;
    },
  });
}

export function useMembers() {
  return useQuery({
    queryKey: usersKeys.members,
    queryFn: async () => {
      const { data, error, response } = await api.GET('/api/ranch/members');
      if (!data) fail(error, response);
      return data;
    },
  });
}

export function useInvitations(enabled: boolean) {
  return useQuery({
    queryKey: usersKeys.invitations,
    enabled,
    queryFn: async () => {
      const { data, error, response } = await api.GET('/api/ranch/invitations');
      if (!data) fail(error, response);
      return data;
    },
  });
}

export function useRolePresets() {
  return useQuery({
    queryKey: usersKeys.presets,
    staleTime: Infinity,
    queryFn: async () => {
      const { data, error, response } = await api.GET('/api/role-presets');
      if (!data) fail(error, response);
      return data;
    },
  });
}

export function useCreateInvitation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (body: InvitationCreate) => {
      const { data, error, response } = await api.POST('/api/ranch/invitations', { body });
      if (!data) fail(error, response);
      return data;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: usersKeys.invitations }),
  });
}

export function useRevokeInvitation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error, response } = await api.DELETE('/api/ranch/invitations/{invitation_id}', {
        params: { path: { invitation_id: id } },
      });
      if (!response.ok) fail(error, response);
    },
    onSuccess: () => client.invalidateQueries({ queryKey: usersKeys.invitations }),
  });
}

export function useUpdateMember() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, body }: { userId: string; body: MemberUpdate }) => {
      const { data, error, response } = await api.PATCH('/api/ranch/members/{user_id}', {
        params: { path: { user_id: userId } },
        body,
      });
      if (!data) fail(error, response);
      return data;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: usersKeys.members }),
  });
}

export function useRemoveMember() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error, response } = await api.DELETE('/api/ranch/members/{user_id}', {
        params: { path: { user_id: userId } },
      });
      if (!response.ok) fail(error, response);
    },
    onSuccess: () => client.invalidateQueries({ queryKey: usersKeys.members }),
  });
}

export async function previewInvitation(token: string): Promise<InvitationPreview> {
  const { data, error, response } = await api.GET('/api/invitations/{token}', {
    params: { path: { token } },
  });
  if (!data) fail(error, response);
  return data;
}

export async function acceptInvitation(token: string): Promise<string> {
  const { data, error, response } = await api.POST('/api/invitations/{token}/accept', {
    params: { path: { token } },
  });
  if (!data) fail(error, response);
  return data.ranch_id;
}

export function errorCode(error: unknown): string {
  return error instanceof ApiError ? error.code : 'network';
}
