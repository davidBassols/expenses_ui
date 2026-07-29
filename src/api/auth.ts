const STORAGE_KEY = 'expenses.auth';

/**
 * Stores Basic-auth credentials in localStorage as base64("user:password").
 * Single-user app: no tokens, no expiry — just the header value the backend expects.
 */
export function saveCredentials(username: string, password: string): void {
  localStorage.setItem(STORAGE_KEY, btoa(`${username}:${password}`));
}

export function clearCredentials(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function isAuthenticated(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

/** Returns the full Authorization header value, or null if not logged in. */
export function getAuthHeader(): string | null {
  const encoded = localStorage.getItem(STORAGE_KEY);
  return encoded ? `Basic ${encoded}` : null;
}
