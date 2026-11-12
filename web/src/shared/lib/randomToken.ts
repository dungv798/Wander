import { browserRandom } from '../domain/RecoveryCode.ts';
import type { RandomSource } from '../domain/RecoveryCode.ts';

/** The number of random bytes of a session secret (256 bits, matching the backend's `SESSION_TOKEN_BYTES` -> 43 base64url characters). */
export const SESSION_TOKEN_BYTES = 32;
/** The number of bytes of a recovery-attempt id (192 bits -> 32 base64url characters, within the 16-128 range the backend allows). */
export const ATTEMPT_ID_BYTES = 24;

const BASE64_PLUS = /\+/g;
const BASE64_SLASH = /\//g;
const BASE64_PAD = /=+$/;

/** A cryptographically secure random base64url string (no `=` padding) of `bytes` bytes; the random source is injectable in tests. */
export function randomToken(bytes: number, random: RandomSource = browserRandom): string {
  const buffer = new Uint8Array(bytes);
  random.fill(buffer);
  let binary = '';
  for (const b of buffer) binary += String.fromCharCode(b);
  return btoa(binary).replace(BASE64_PLUS, '-').replace(BASE64_SLASH, '_').replace(BASE64_PAD, '');
}

/** A new session secret for this device (a new device generates it itself, the server keeps only the hash). */
export function newSessionToken(random: RandomSource = browserRandom): string {
  return randomToken(SESSION_TOKEN_BYTES, random);
}

/** The id of a recovery attempt. */
export function newAttemptId(random: RandomSource = browserRandom): string {
  return randomToken(ATTEMPT_ID_BYTES, random);
}
