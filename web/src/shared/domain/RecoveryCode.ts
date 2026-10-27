import { RECOVERY_CODE } from '../const/limits.const.ts';

/** Nguồn ngẫu nhiên có thể thay (crypto thật ở trình duyệt, số cố định trong test): nguyên lý D của SOLID. */
export interface RandomSource {
  /** Điền đầy mảng byte ngẫu nhiên. */
  fill(bytes: Uint8Array<ArrayBuffer>): void;
}

/** Nguồn ngẫu nhiên an toàn của trình duyệt (`crypto.getRandomValues`). */
export const browserRandom: RandomSource = {
  /** Điền mảng bằng `crypto.getRandomValues`. */
  fill(bytes: Uint8Array<ArrayBuffer>): void {
    crypto.getRandomValues(bytes);
  },
};

const MASK_5_BITS = 31;
const SPACES_AND_DASHES = /[\s-]/g;

/** Mã khôi phục bất biến: 30 ký hiệu Crockford hiện thành 6 nhóm × 5 (khớp `Secrets.newRecoveryCode()` của backend). */
export class RecoveryCode {
  readonly normalized: string;

  /** Hàm tạo riêng tư; dùng `generate` hoặc `parse`. */
  private constructor(normalized: string) {
    this.normalized = normalized;
  }

  /** Chuẩn hóa y hệt `Secrets.normalize` của backend: chữ hoa, bỏ khoảng trắng và gạch, O→0, I/L→1 (ký tự lạ còn lại làm `parse` trả null). */
  static normalize(text: string): string {
    return text.toUpperCase().replace(SPACES_AND_DASHES, '').replace(/O/g, '0').replace(/[IL]/g, '1');
  }

  /** Sinh mã mới từ nguồn ngẫu nhiên (5 bit mỗi ký hiệu nên phân phối đều). CHỈ cho bản giả/prototype: mã thật do máy chủ sinh và băm (`Secrets.newRecoveryCode`), FE-10 không dùng hàm này. */
  static generate(random: RandomSource = browserRandom): RecoveryCode {
    const bytes = new Uint8Array(RECOVERY_CODE.LENGTH);
    random.fill(bytes);
    const chars = Array.from(bytes, (b) => RECOVERY_CODE.ALPHABET.charAt(b & MASK_5_BITS));
    return new RecoveryCode(chars.join(''));
  }

  /** Đọc mã người dùng nhập; trả null nếu sai độ dài hoặc có ký hiệu ngoài bảng chữ. */
  static parse(text: string): RecoveryCode | null {
    const n = RecoveryCode.normalize(text);
    const ok = n.length === RECOVERY_CODE.LENGTH && [...n].every((c) => RECOVERY_CODE.ALPHABET.includes(c));
    return ok ? new RecoveryCode(n) : null;
  }

  /** Sáu nhóm 5 ký hiệu. */
  get groups(): string[] {
    const size = RECOVERY_CODE.GROUP_SIZE;
    return Array.from({ length: RECOVERY_CODE.GROUP_COUNT }, (_, i) => this.normalized.slice(i * size, (i + 1) * size));
  }

  /** Dạng hiển thị `XXXXX-XXXXX-…`. */
  format(): string {
    return this.groups.join(RECOVERY_CODE.SEPARATOR);
  }

  /** Chọn ngẫu nhiên các chỉ số nhóm (không trùng, tăng dần) để bắt nhập lại khi xác nhận đã lưu (DR-018 B3). */
  pickChallenge(random: RandomSource = browserRandom): number[] {
    const chosen = new Set<number>();
    const bytes = new Uint8Array(1);
    while (chosen.size < RECOVERY_CODE.CHALLENGE_GROUPS) {
      random.fill(bytes);
      chosen.add((bytes[0] ?? 0) % RECOVERY_CODE.GROUP_COUNT);
    }
    return [...chosen].sort((a, b) => a - b);
  }

  /** Kiểm các nhóm người dùng nhập lại: `answers[i]` là nhóm thứ `indexes[i]`; so sau khi chuẩn hóa. */
  matchesChallenge(indexes: readonly number[], answers: readonly string[]): boolean {
    const groups = this.groups;
    return indexes.length === answers.length && indexes.every((g, i) => RecoveryCode.normalize(answers[i] ?? '') === groups[g]);
  }
}
