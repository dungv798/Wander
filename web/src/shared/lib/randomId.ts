const HEX_RADIX = 16;
const FALLBACK_BYTES = 16;
const HEX_DIGITS_PER_BYTE = 2;

/** Mã ngẫu nhiên: `crypto.randomUUID` chỉ có ở ngữ cảnh an toàn (HTTPS/localhost), nên dự phòng bằng `getRandomValues` khi mở qua http://địa-chỉ-LAN. Bản backend thật sẽ cấp mã. */
export function randomId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return Array.from(crypto.getRandomValues(new Uint8Array(FALLBACK_BYTES)), (b) => b.toString(HEX_RADIX).padStart(HEX_DIGITS_PER_BYTE, '0')).join('');
}
