/** Business limits. They MUST match the backend (docs/ux/data-needs.md section 4, backend/src/main/java/com/wander/**). Money unit: thousand dong (D17). */
export const LIMITS = {
  MAX_TRIP_DAYS: 366,
  MAX_TRIP_NAME: 120,
  MAX_ITEM_TITLE: 200,
  MAX_ITEM_NOTE: 2000,
  MAX_REASON: 200,
  MAX_DURATION_MIN: 10080,
  MAX_STYLES: 5,
  MAX_MONEY_THOUSAND: 1_000_000_000,
  MAX_MONEY_DIGITS: 10,
  MAX_DISPLAY_NAME: 40,
  /** The deletion-request reason (matching the backend). */
  MAX_REQUEST_REASON: 200,
  /** The checklist group and item names (matching the backend). */
  MAX_CHECKLIST_GROUP: 60,
  MAX_CHECKLIST_TITLE: 120,
  /** The maximum number of items in a trip's 'Recently deleted' (kept until deleted by hand so a ceiling is needed; matching the backend when it exists). */
  MAX_TRASH: 500,
  /** The number of tries of the ' - n' suffix when a trip name clashes (DR-006). */
  MAX_NAME_SUFFIX: 200,
} as const;

/** The recovery code: 30 Crockford symbols, 6 groups x 5 (about 150 bits), like the backend's `Secrets.newRecoveryCode()`. */
export const RECOVERY_CODE = {
  ALPHABET: '0123456789ABCDEFGHJKMNPQRSTVWXYZ',
  LENGTH: 30,
  GROUP_SIZE: 5,
  GROUP_COUNT: 6,
  /** The number of groups the system picks at random for the user to type again when confirming it was saved (DR-018 B3). */
  CHALLENGE_GROUPS: 2,
  SEPARATOR: '-',
} as const;

/** The device pairing code and the approval code: 8 Crockford symbols, shown as XXXX-XXXX. */
export const PAIRING_CODE = { LENGTH: 8, GROUP_SIZE: 4 } as const;
