/** The thresholds (px) for collapsing the trip sheet head when scrolling the schedule list (B-01, DR-037). */
export const COLLAPSE = {
  /** Scrolling past this amount collapses the sheet head. */
  AT_PX: 40,
  /** It re-opens only when scrolled back near the top; lower than `AT_PX` for hysteresis, to avoid flicker. */
  EXPAND_AT_PX: 4,
  /** There must be at least this much room to scroll before collapsing: collapsing makes the scroll area grow, short content would be clamped to the top and re-open, looping forever. */
  MIN_SCROLLABLE_PX: 200,
} as const;
