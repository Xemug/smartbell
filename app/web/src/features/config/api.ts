import { api } from '../../api/client';
import type { components } from '../../api/schema';

export type User = components['schemas']['UserOut'];
export type ProfileUpdate = components['schemas']['ProfileUpdate'];
export type RanchDetail = components['schemas']['RanchDetail'];
export type RanchUpdate = components['schemas']['RanchUpdate'];
export type RanchCreation = components['schemas']['RanchCreation'];

export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
export const PHOTO_TYPES = ['image/jpeg', 'image/png'] as const;

/** A refusal from the API; `code` is its `detail` (e.g. `photo_too_large`) or `http_<status>`. */
export class ApiError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = 'ApiError';
  }
}

function refusal(error: unknown, response: Response): ApiError {
  const detail = (error as { detail?: unknown } | undefined)?.detail;
  return new ApiError(typeof detail === 'string' ? detail : `http_${response.status}`);
}

export async function updateProfile(body: ProfileUpdate): Promise<User> {
  const { data, error, response } = await api.PATCH('/api/users/me', { body });
  if (!data) throw refusal(error, response);
  return data;
}

/** The design's own check, before the upload: JPG or PNG, at most 2MB. The API checks again. */
export function photoProblem(file: File): 'photoType' | 'photoSize' | null {
  if (!(PHOTO_TYPES as readonly string[]).includes(file.type)) return 'photoType';
  if (file.size > MAX_PHOTO_BYTES) return 'photoSize';
  return null;
}

export async function uploadPhoto(file: File): Promise<User> {
  const { data, error, response } = await api.PUT('/api/users/me/photo', {
    body: file as unknown as string,
    headers: { 'Content-Type': file.type },
    // The raw file is the body; openapi-fetch would otherwise JSON-encode it.
    bodySerializer: (body) => body as unknown as BodyInit,
  });
  if (!data) throw refusal(error, response);
  return data;
}

export async function getRanch(): Promise<RanchDetail> {
  const { data, error, response } = await api.GET('/api/ranch');
  if (!data) throw refusal(error, response);
  return data;
}

export async function updateRanch(body: RanchUpdate): Promise<RanchDetail> {
  const { data, error, response } = await api.PATCH('/api/ranch', { body });
  if (!data) throw refusal(error, response);
  return data;
}

export async function createRanch(name: string): Promise<{ id: string; name: string }> {
  const { data, error, response } = await api.POST('/api/ranches', { body: { name } });
  if (!data) throw refusal(error, response);
  return data;
}

/** Deletes the ranch named by `ranchId`, whatever ranch is active. */
export async function deleteRanch(ranchId: string, confirmName: string): Promise<void> {
  const { error, response } = await api.DELETE('/api/ranch', {
    body: { confirm_name: confirmName },
    headers: { 'X-Ranch-Id': ranchId },
  });
  if (!response.ok) throw refusal(error, response);
}
