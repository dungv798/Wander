import { RECOVERY_CODE } from '../const/limits.const.ts';

/** A replaceable random source (real crypto in the browser, a fixed number in tests): the D principle of SOLID. */
export interface RandomSource {
  /** Fills the array with random bytes. */
  fill(bytes: Uint8Array<ArrayBuffer>): void;
}

/** The browser's secure random source (`crypto.getRandomValues`). */
export const browserRandom: RandomSource = {
  /** Fills the array with `crypto.getRandomValues`. */
  fill(bytes: Uint8Array<ArrayBuffer>): void {
    crypto.getRandomValues(bytes);
  },
};

const MASK_5_BITS = 31;
const SPACES_AND_DASHES = /[\s-]/g;

/** An immutable recovery code: 30 Crockford symbols shown as 6 groups x 5 (matching the backend's `Secrets.newRecoveryCode()`). */
export class RecoveryCode {
  readonly normalized: string;

  /** A private constructor; use `generate` or `parse`. */
  private constructor(normalized: string) {
    this.normalized = normalized;
  }

  /** Normalizes exactly like the backend's `Secrets.normalize`: uppercase, drops whitespace and hyphens, O->0, I/L->1 (any remaining strange character makes `parse` return null). */
  static normalize(text: string): string {
    return text.toUpperCase().replace(SPACES_AND_DASHES, '').replace(/O/g, '0').replace(/[IL]/g, '1');
  }

  /** Generates a new code from a random source (5 bits per symbol so the distribution is uniform). ONLY for the fake/prototype: a real code is generated and hashed by the server (`Secrets.newRecoveryCode`), FE-10 does not use this function. */
  static generate(random: RandomSource = browserRandom): RecoveryCode {
    const bytes = new Uint8Array(RECOVERY_CODE.LENGTH);
    random.fill(bytes);
    const chars = Array.from(bytes, (b) => RECOVERY_CODE.ALPHABET.charAt(b & MASK_5_BITS));
    return new RecoveryCode(chars.join(''));
  }

  /** Reads a code typed by the user; returns null if the length is wrong or there is a symbol outside the alphabet. */
  static parse(text: string): RecoveryCode | null {
    const n = RecoveryCode.normalize(text);
    const ok = n.length === RECOVERY_CODE.LENGTH && [...n].every((c) => RECOVERY_CODE.ALPHABET.includes(c));
    return ok ? new RecoveryCode(n) : null;
  }

  /** Six groups of 5 symbols. */
  get groups(): string[] {
    const size = RECOVERY_CODE.GROUP_SIZE;
    return Array.from({ length: RECOVERY_CODE.GROUP_COUNT }, (_, i) => this.normalized.slice(i * size, (i + 1) * size));
  }

  /** The display form `XXXXX-XXXXX-...`. */
  format(): string {
    return this.groups.join(RECOVERY_CODE.SEPARATOR);
  }

  /** Randomly chooses group indexes (distinct, increasing) to require re-typing when confirming it was saved (DR-018 B3). */
  pickChallenge(random: RandomSource = browserRandom): number[] {
    const chosen = new Set<number>();
    const bytes = new Uint8Array(1);
    while (chosen.size < RECOVERY_CODE.CHALLENGE_GROUPS) {
      random.fill(bytes);
      chosen.add((bytes[0] ?? 0) % RECOVERY_CODE.GROUP_COUNT);
    }
    return [...chosen].sort((a, b) => a - b);
  }

  /** Checks the groups the user typed again: `answers[i]` is group `indexes[i]`; compared after normalization. */
  matchesChallenge(indexes: readonly number[], answers: readonly string[]): boolean {
    const groups = this.groups;
    return indexes.length === answers.length && indexes.every((g, i) => RecoveryCode.normalize(answers[i] ?? '') === groups[g]);
  }
}
