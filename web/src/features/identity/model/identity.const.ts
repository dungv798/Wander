/** Limits and durations of the anonymous identity (DR-001, DR-018). The real server version MUST match these numbers. */
export const IDENTITY = {
  /** The maximum number of wrong entries on one device before a temporary lock (D23). */
  MAX_ATTEMPTS: 5,
  /** A 15-minute temporary lock after the number of wrong entries is reached (a fake; the real per-device lock is in the backend). */
  LOCK_MS: 900_000,
  /** A pairing code expires after 5 minutes. */
  PAIR_TTL_MS: 300_000,
  /** The request limit for device approval: at most 3 requests in 10 minutes (DR-018 E1). */
  PAIR_REQUEST_LIMIT: 3,
  PAIR_REQUEST_WINDOW_MS: 600_000,
  /** The number of 'matching number' choices shown to the approving device (one of them is right). */
  MATCH_OPTIONS: 3,
  /** The matching number is a two-digit number. */
  MATCH_MIN: 10,
  MATCH_MAX: 99,
  /** The number of 'Recent activity' events kept and shown. */
  MAX_EVENTS: 50,
  SHOWN_EVENTS: 8,
  /** Maximum length of a device name. */
  MAX_DEVICE_NAME: 40,
  /** A recovery attempt expires after 15 minutes (it must start over). */
  ATTEMPT_TTL_MS: 900_000,
  /** The polling rhythm to check a pairing request/expiry while waiting, ms. */
  POLL_MS: 1000,
} as const;

/** The file name of the downloaded recovery code. */
export const CODE_FILE_NAME = 'wander-ma-khoi-phuc.txt';

/** The default device name of the trial version. */
export const DEFAULT_DEVICE_NAME = 'Thiết bị này';
