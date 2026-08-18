import type { ApiResponse } from '../types/ApiResponse';
import { clearCredentials, getAuthHeader } from './auth';

/** Thrown on HTTP 401 — signals the app to bounce back to the login screen. */
export class AuthError extends Error {
  constructor() {
    super('Invalid credentials or session expired');
    this.name = 'AuthError';
  }
}

/**
 * Thin wrapper around fetch that understands the backend's ApiResponse<T> envelope.
 * Injects the Basic Authorization header from stored credentials.
 * Throws AuthError on 401 (and clears stale credentials), Error otherwise.
 */
export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const authHeader = getAuthHeader();
  const response = await fetch('https://expenses-h3a5.onrender.com'+url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(authHeader ? { Authorization: authHeader } : {}),
      ...options?.headers,
    },
  });

  if (response.status === 401) {
    clearCredentials();
    throw new AuthError();
  }

  // 204 No Content (e.g. DELETE) has no body
  if (response.status === 204) {
    return undefined as T;
  }

  const body: ApiResponse<T> = await response.json();

  if (!response.ok || !body.success) {
    throw new Error(body.message || `Request failed with status ${response.status}`);
  }

  return body.data;
}
