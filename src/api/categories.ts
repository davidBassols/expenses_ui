import { apiFetch } from './client';
import type { Category, CategoryRequest } from '../types/Category';

const BASE = '/api/v1/categories';

export function getCategories(): Promise<Category[]> {
  return apiFetch<Category[]>(BASE);
}

export function createCategory(request: CategoryRequest): Promise<Category> {
  return apiFetch<Category>(BASE, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export function updateCategory(id: string, request: CategoryRequest): Promise<Category> {
  return apiFetch<Category>(`${BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(request),
  });
}

export function deleteCategory(id: string): Promise<void> {
  return apiFetch<void>(`${BASE}/${id}`, { method: 'DELETE' });
}

export function reorderCategories(categoryIds: string[]): Promise<Category[]> {
  return apiFetch<Category[]>(`${BASE}/reorder`, {
    method: 'PUT',
    body: JSON.stringify(categoryIds),
  });
}
