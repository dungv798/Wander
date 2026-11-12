/** The backoff rhythm for every consecutive poll error; unit ms, it does not change the server's approval time limit. */
export const PAIRING_POLL = {
  BACKOFF_FACTOR: 2,
  MAX_DELAY_MS: 30_000,
  RATE_LIMIT_STATUS: 429,
  VISIBILITY_EVENT: 'visibilitychange',
} as const;
