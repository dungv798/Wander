import { ApiError } from './ApiError.ts';
import { CODE_KIND, ERROR_INFO, UNKNOWN_CODE } from './errorMessages.const.ts';
import type { ErrorInfo } from './errorMessages.const.ts';

/** An error that has been described for the UI: a Vietnamese hint + a small code to ask support. */
export interface DescribedError extends ErrorInfo {
  readonly code: string;
}

/** Turns any error into a Vietnamese hint by code (`ApiError.code`); an unknown error counts as an error on Wander's side. It never exposes the raw error content. */
export function describeError(error: unknown): DescribedError {
  const code = error instanceof ApiError ? error.code : UNKNOWN_CODE;
  return { ...ERROR_INFO[CODE_KIND.get(code) ?? 'internal'], code };
}
