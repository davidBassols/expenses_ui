import { apiFetch } from './client';
import type { Tag, TagDetail, TagRequest } from '../types/Tag';

const BASE = '/api/v1/tags';

export function getTags(): Promise<Tag[]> {
  return apiFetch<Tag[]>(BASE);
}

export function getTagDetail(id: string): Promise<TagDetail> {
  return apiFetch<TagDetail>(`${BASE}/${id}/detail`);
}

export function createTag(request: TagRequest): Promise<Tag> {
  return apiFetch<Tag>(BASE, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export function updateTag(id: string, request: TagRequest): Promise<Tag> {
  return apiFetch<Tag>(`${BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(request),
  });
}

export function deleteTag(id: string): Promise<void> {
  return apiFetch<void>(`${BASE}/${id}`, { method: 'DELETE' });
}
