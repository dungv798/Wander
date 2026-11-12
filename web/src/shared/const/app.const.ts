/** Browser-side storage keys. Only non-secret data (RG-6: no other place to store secrets is added). */
export const STORAGE = {
  DISCOVER: 'wander.web.discover.v1',
  /** This device's session secret (Bearer); kept in localStorage per AD-1 until reviewed in RG-6. */
  TOKEN: 'wander.web.token.v1',
  /** This device's flags (just recovered) and the known mark to choose the session-ended screen branch; contains NO secret. */
  SESSION: 'wander.web.session.v2',
  /** The count of wrong code entries of this device (persistent across reloads). */
  LOCKS: 'wander.web.locks.v1',
  /** The first-time intro was watched (it shows only once). */
  ONBOARDING: 'wander.web.onboarding.v1',
  /** The read-only copy of the trips of the most recent successful load, to view when the server does not answer (B-09). Deleted when the session ends. */
  TRIPS_CACHE: 'wander.web.trips.cache.v1',
} as const;

/** The UI breakpoints (px), matching the prototype CSS (docs/ux/screens.md 'Adaptive frame'). */
export const BREAKPOINT = {
  WIDE: 768,
  DRAWER: 1280,
} as const;

/** Shared media queries. */
export const MEDIA = {
  WIDE: `(min-width: ${BREAKPOINT.WIDE}px)`,
  DRAWER: `(min-width: ${BREAKPOINT.DRAWER}px)`,
  REDUCED_MOTION: '(prefers-reduced-motion: reduce)',
} as const;

/** UI sizes and durations. */
export const UI = {
  TAP_TARGET_PX: 44,
  /** How long the `enter` layer (fading in on a screen change) lasts, ms. */
  ENTER_MS: 1100,
  /** The wait between typing a search and filtering, ms. */
  SEARCH_DEBOUNCE_MS: 120,
  MONTHS_IN_YEAR: 12,
  /** The maximum number of 'Go this month' places. */
  MONTH_LIMIT: 5,
  /** The cumulative delay between cards fading in, ms. */
  STAGGER_MS: 70,
  STAGGER_WALL_MS: 60,
  TOAST_MS: 2600,
  TOAST_UNDO_MS: 10_000,
  /** After this long (ms) if the skeleton is still not done, explain: the free-tier server sleeps when idle, the first call can take about a minute. */
} as const;

/** The thresholds of the card-swipe gesture (matching the prototype). */
export const SWIPE = {
  DISTANCE_PX: 110,
  FAST_VELOCITY: 0.6,
  FAST_MIN_DISTANCE_PX: 40,
  TAP_MOVE_PX: 8,
  STAMP_FULL_PX: 90,
  PROGRESS_FULL_PX: 130,
  ROTATE_DIVISOR: 18,
  DRAG_Y_FACTOR: 0.3,
  FLING_PX: 560,
  FLING_UP_PX: -30,
  FLING_ROTATE_DEG: 28,
  FLING_MS: 320,
  FLING_DONE_MS: 300,
  RETURN_MS: 280,
  /** Tapping the left half of a multi-photo card = the previous photo, the right half = the next (the boundary by width ratio; PO 28/10/2026, DR-023). */
  PHOTO_SPLIT: 0.5,
  /** The elements in the card that open the detail when tapped instead of changing the photo (the name and info block). */
  DETAIL_TAP_SELECTOR: '.card-info',
  /** The number of cards built at once in the deck. */
  VISIBLE_CARDS: 3,
  /** The number of cards after the displayed cards whose photos are preloaded. */
  PRELOAD_CARDS: 3,
} as const;
