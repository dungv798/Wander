import { STORAGE } from '../const/app.const.ts';
import { PersistentStore } from './PersistentStore.ts';

/** The session secret of THIS DEVICE (Bearer). Stored in localStorage per decision AD-1 (kept until reviewed in RG-6); the server keeps only the hash. */
export interface TokenState {
  readonly token: string | null;
}

/** The minimum length and the alphabet of the session secret (matching the backend's `IdentityConstants.SESSION_TOKEN_REGEX`: 43-128 base64url characters). */
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43,128}$/;

/** Cleans the stored value: only a string of the right session-secret shape is accepted; anything else counts as no session yet. */
export function sanitizeToken(raw: unknown): TokenState | null {
  const token = typeof raw === 'object' && raw !== null ? (raw as { token?: unknown }).token : null;
  return { token: typeof token === 'string' && TOKEN_PATTERN.test(token) ? token : null };
}

/** The session-secret store shared by the HTTP client (attaches the header) and the identity feature (create, revoke). */
export const sessionTokenStore = new PersistentStore<TokenState>(STORAGE.TOKEN, { token: null }, sanitizeToken);

/** The current session secret or null if this device has no session yet. */
export function currentToken(): string | null {
  return sessionTokenStore.getSnapshot().token;
}

/** Stores a new session secret (after creating an identity, recovering or being paired). */
export function setToken(token: string): void {
  sessionTokenStore.update(() => ({ token }));
}

/** Forgets the session secret (the session ended or an intentional leave). */
export function clearToken(): void {
  sessionTokenStore.update(() => ({ token: null }));
}
