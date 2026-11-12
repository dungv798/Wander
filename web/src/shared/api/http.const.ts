/** The HTTP status codes and header names used in the API call layer (one place, no numbers/strings scattered in code). */
export const HTTP = {
  NO_CONTENT: 204,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
} as const;

/** The header names and the JSON content type. */
export const HEADER = {
  ACCEPT: 'Accept',
  CONTENT_TYPE: 'Content-Type',
  JSON: 'application/json',
} as const;

/** The error code that the API call layer sets itself when the server returns no code (matching `docs/ux/error-codes.md`). */
export const CLIENT_ERROR = {
  NETWORK: 'NETWORK',
  INTERNAL: 'INTERNAL',
} as const;

/** The `fetch` error name when cancelled by `AbortSignal`: not a network error, the caller handles it itself. */
export const ABORT_ERROR_NAME = 'AbortError';
