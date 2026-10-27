import { FORMAT } from '../const/format.const.ts';
import { LIMITS } from '../const/limits.const.ts';

/** Mã lỗi khi nhập tiền sai; trùng tên mã của backend (`NEGATIVE`, `TOO_LARGE`, `MALFORMED`). */
export type MoneyErrorCode = 'NEGATIVE' | 'TOO_LARGE' | 'MALFORMED';

/** Lỗi nhập tiền, mang mã để giao diện chọn lời nhắc ở `errorMessages`. */
export class MoneyError extends Error {
  readonly code: MoneyErrorCode;

  /** Tạo lỗi với mã cụ thể. */
  constructor(code: MoneyErrorCode) {
    super(code);
    this.name = 'MoneyError';
    this.code = code;
  }
}

const NEGATIVE_INTEGER = /^-\d+$/;
const DIGITS_ONLY = /^\d+$/;
const LEADING_ZEROS = /^0+(?=\d)/;
const THOUSANDS_GROUPING = /\B(?=(\d{3})+(?!\d))/g;

/**
 * Số tiền bất biến, đơn vị NGHÌN ĐỒNG, số nguyên không âm (D17).
 * "Chưa biết giá" (D18: ô trống) KHÔNG phải một Money mà là `null`; `Money.ofThousand(0)` là "biết bằng không".
 */
export class Money {
  readonly thousand: number;

  /** Hàm tạo riêng tư: dùng `ofThousand` hoặc `parse` để bảo đảm bất biến. */
  private constructor(thousand: number) {
    this.thousand = thousand;
  }

  /** Tạo từ số nghìn đồng; ném `MoneyError` nếu âm, không nguyên hoặc vượt trần. */
  static ofThousand(thousand: number): Money {
    if (!Number.isInteger(thousand)) throw new MoneyError('MALFORMED');
    if (thousand < 0) throw new MoneyError('NEGATIVE');
    if (thousand > LIMITS.MAX_MONEY_THOUSAND) throw new MoneyError('TOO_LARGE');
    return new Money(thousand);
  }

  /** Đọc ô nhập: rỗng → `null` (chưa biết giá); số nguyên không âm → Money; còn lại ném `MoneyError`. */
  static parse(text: string): Money | null {
    const s = text.trim();
    if (s === '') return null;
    if (NEGATIVE_INTEGER.test(s)) throw new MoneyError('NEGATIVE');
    if (!DIGITS_ONLY.test(s)) throw new MoneyError('MALFORMED');
    if (s.replace(LEADING_ZEROS, '').length > LIMITS.MAX_MONEY_DIGITS) throw new MoneyError('TOO_LARGE');
    return Money.ofThousand(Number(s));
  }

  /** Số đồng đầy đủ (nghìn × 1000). */
  get vnd(): number {
    return this.thousand * FORMAT.VND_PER_THOUSAND;
  }

  /** Tổng hai khoản; vượt trần thì ném `MoneyError('TOO_LARGE')`. */
  plus(other: Money): Money {
    return Money.ofThousand(this.thousand + other.thousand);
  }

  /** Hiển thị đầy đủ VND, dấu chấm hàng nghìn, khoảng trắng không ngắt trước ₫ (ví dụ `1.500.000 ₫`). */
  format(): string {
    return formatVnd(this.vnd);
  }
}

/** Định dạng số đồng đầy đủ (không phải nghìn); làm tròn về số nguyên, bỏ dấu âm. */
export function formatVnd(vnd: number): string {
  const digits = String(Math.abs(Math.round(vnd)));
  const grouped = digits.replace(THOUSANDS_GROUPING, FORMAT.THOUSAND_SEPARATOR);
  return `${grouped}${FORMAT.NBSP}${FORMAT.CURRENCY_SYMBOL}`;
}
