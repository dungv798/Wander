/** An API/data-store call error, carrying the server code (docs/ux/error-codes.md) so the UI picks a Vietnamese hint. */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number | null;

  /** Creates an error with a code (for example `NOT_FOUND`, `NETWORK`) and the HTTP status if any. */
  constructor(code: string, status: number | null = null) {
    super(code);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }

  /** An error from a lost connection or a store that could not load (unlike a business error). */
  get isNetwork(): boolean {
    return this.code === 'NETWORK';
  }
}
