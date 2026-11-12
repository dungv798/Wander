const HEX_RADIX = 16;
const FALLBACK_BYTES = 16;
const HEX_DIGITS_PER_BYTE = 2;

/** A random id: `crypto.randomUUID` exists only in a secure context (HTTPS/localhost), so it falls back to `getRandomValues` when opened through http://LAN-address. The real backend version will issue the id. */
export function randomId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return Array.from(crypto.getRandomValues(new Uint8Array(FALLBACK_BYTES)), (b) => b.toString(HEX_RADIX).padStart(HEX_DIGITS_PER_BYTE, '0')).join('');
}
