import { PAIRING_CODE, RECOVERY_CODE } from '../const/limits.const.ts';
import { RecoveryCode, browserRandom } from './RecoveryCode.ts';
import type { RandomSource } from './RecoveryCode.ts';

const MASK_5_BITS = 31;

/** Mã ghép thiết bị bất biến: 8 ký hiệu Crockford hiện `XXXX-XXXX` (khớp `Secrets.newShortCode()` của backend). Hết hạn và dùng một lần do máy chủ quản. */
export class PairingCode {
  readonly normalized: string;

  /** Hàm tạo riêng tư; dùng `generate` hoặc `parse`. */
  private constructor(normalized: string) {
    this.normalized = normalized;
  }

  /** Sinh mã mới (CHỈ cho bản giả; mã thật do máy chủ sinh). */
  static generate(random: RandomSource = browserRandom): PairingCode {
    const bytes = new Uint8Array(PAIRING_CODE.LENGTH);
    random.fill(bytes);
    return new PairingCode(Array.from(bytes, (b) => RECOVERY_CODE.ALPHABET.charAt(b & MASK_5_BITS)).join(''));
  }

  /** Đọc mã người dùng nhập (chuẩn hóa như mã khôi phục); null nếu sai độ dài hoặc có ký hiệu lạ. */
  static parse(text: string): PairingCode | null {
    const n = RecoveryCode.normalize(text);
    const ok = n.length === PAIRING_CODE.LENGTH && [...n].every((c) => RECOVERY_CODE.ALPHABET.includes(c));
    return ok ? new PairingCode(n) : null;
  }

  /** Dạng hiển thị `XXXX-XXXX`. */
  format(): string {
    return `${this.normalized.slice(0, PAIRING_CODE.GROUP_SIZE)}${RECOVERY_CODE.SEPARATOR}${this.normalized.slice(PAIRING_CODE.GROUP_SIZE)}`;
  }
}
