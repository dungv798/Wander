import { browserRandom } from '../domain/RecoveryCode.ts';
import type { RandomSource } from '../domain/RecoveryCode.ts';

/** Số byte ngẫu nhiên của một bí mật phiên (256 bit, khớp `SESSION_TOKEN_BYTES` của backend → 43 ký tự base64url). */
export const SESSION_TOKEN_BYTES = 32;
/** Số byte của mã nhận diện một lần khôi phục (192 bit → 32 ký tự base64url, trong khoảng 16–128 mà backend cho phép). */
export const ATTEMPT_ID_BYTES = 24;

const BASE64_PLUS = /\+/g;
const BASE64_SLASH = /\//g;
const BASE64_PAD = /=+$/;

/** Chuỗi ngẫu nhiên an toàn mật mã dạng base64url (không đệm `=`) từ `bytes` byte; nguồn ngẫu nhiên tiêm được khi test. */
export function randomToken(bytes: number, random: RandomSource = browserRandom): string {
  const buffer = new Uint8Array(bytes);
  random.fill(buffer);
  let binary = '';
  for (const b of buffer) binary += String.fromCharCode(b);
  return btoa(binary).replace(BASE64_PLUS, '-').replace(BASE64_SLASH, '_').replace(BASE64_PAD, '');
}

/** Bí mật phiên mới cho máy này (máy mới tự sinh, máy chủ chỉ giữ băm). */
export function newSessionToken(random: RandomSource = browserRandom): string {
  return randomToken(SESSION_TOKEN_BYTES, random);
}

/** Mã nhận diện một lần thử khôi phục. */
export function newAttemptId(random: RandomSource = browserRandom): string {
  return randomToken(ATTEMPT_ID_BYTES, random);
}
