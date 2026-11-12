import { FORMAT } from '../const/format.const.ts';
import { LIMITS } from '../const/limits.const.ts';

/** The error codes for wrong money entry; the same names as the backend's codes (`NEGATIVE`, `TOO_LARGE`, `MALFORMED`). */
export type MoneyErrorCode = 'NEGATIVE' | 'TOO_LARGE' | 'MALFORMED';

/** A money-entry error, carrying a code so the UI picks a hint in `errorMessages`. */
export class MoneyError extends Error {
  readonly code: MoneyErrorCode;

  /** Creates an error with a specific code. */
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
 * An immutable amount of money, the unit is THOUSAND DONG, a non-negative integer (D17).
 * 'Price unknown' (D18: an empty box) is NOT a Money but `null`; `Money.ofThousand(0)` is 'known to be zero'.
 */
export class Money {
  readonly thousand: number;

  /** A private constructor: use `ofThousand` or `parse` to guarantee the invariant. */
  private constructor(thousand: number) {
    this.thousand = thousand;
  }

  /** Creates from a number of thousand dong; throws `MoneyError` if negative, not an integer or above the ceiling. */
  static ofThousand(thousand: number): Money {
    if (!Number.isInteger(thousand)) throw new MoneyError('MALFORMED');
    if (thousand < 0) throw new MoneyError('NEGATIVE');
    if (thousand > LIMITS.MAX_MONEY_THOUSAND) throw new MoneyError('TOO_LARGE');
    return new Money(thousand);
  }

  /** Reads an input box: empty -> `null` (price unknown); a non-negative integer -> Money; anything else throws `MoneyError`. */
  static parse(text: string): Money | null {
    const s = text.trim();
    if (s === '') return null;
    if (NEGATIVE_INTEGER.test(s)) throw new MoneyError('NEGATIVE');
    if (!DIGITS_ONLY.test(s)) throw new MoneyError('MALFORMED');
    if (s.replace(LEADING_ZEROS, '').length > LIMITS.MAX_MONEY_DIGITS) throw new MoneyError('TOO_LARGE');
    return Money.ofThousand(Number(s));
  }

  /** The full number of dong (thousands x 1000). */
  get vnd(): number {
    return this.thousand * FORMAT.VND_PER_THOUSAND;
  }

  /** The sum of two amounts; above the ceiling it throws `MoneyError('TOO_LARGE')`. */
  plus(other: Money): Money {
    return Money.ofThousand(this.thousand + other.thousand);
  }

  /** Displays full VND, a dot as the thousands separator, a non-breaking space before the dong sign (for example `1.500.000 dong`). */
  format(): string {
    return formatVnd(this.vnd);
  }
}

/** Formats a full number of dong (not thousands); rounds to an integer, drops the minus sign. */
export function formatVnd(vnd: number): string {
  const digits = String(Math.abs(Math.round(vnd)));
  const grouped = digits.replace(THOUSANDS_GROUPING, FORMAT.THOUSAND_SEPARATOR);
  return `${grouped}${FORMAT.NBSP}${FORMAT.CURRENCY_SYMBOL}`;
}
