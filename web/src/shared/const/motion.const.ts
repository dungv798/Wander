/**
 * The shared motion durations (ms). The real source for CSS is the `--dur-*` tokens in `styles/tokens.css`;
 * `motion.const.test.ts` keeps the two places matching. TS code (JS animation, timers) reads from here, not scattering numbers.
 * The range by PO 05/11/2026: a press 100-160 ms, a surface change 220-280 ms, the map camera 650-900 ms.
 */
export const MOTION = {
  /** Touch/press-button feedback. */
  PRESS_MS: 140,
  /** Opening/changing a surface (a sheet, a panel, a screen transition). */
  SURFACE_MS: 240,
  /** The map camera flies to a new scene (matching `MAP.FLY_MS`). */
  MAP_FLY_MS: 750,
} as const;

/** The allowed range of each motion group (ms), so tests catch a number change beyond the approved bounds. */
export const MOTION_RANGE = {
  PRESS_MS: [100, 160],
  SURFACE_MS: [220, 280],
  MAP_FLY_MS: [650, 900],
} as const;
