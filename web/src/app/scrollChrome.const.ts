/** The attribute on <html> while the top/bottom bars are sliding out (CSS reads it in mobile.css). */
export const CHROME_ATTR = 'data-chrome';
export const CHROME_HIDDEN = 'hidden';

/** The scroll threshold (px) for hiding/showing the top/bottom bars; it has hysteresis so a shaky swipe does not make them flicker. */
export const SCROLL_CHROME = {
  /** Below this threshold (near the top of the page) the bars are always shown. */
  ALWAYS_SHOW_ABOVE_PX: 120,
  /** The page must be scrolled down this much more from the reversal point before they hide. */
  HIDE_AFTER_DOWN_PX: 48,
  /** Scrolling up this much from the reversal point is enough to show them again. */
  SHOW_AFTER_UP_PX: 20,
  /** Within this distance (px) of the page bottom or closer the bars show, so the tabs can be touched after scrolling to the end. */
  ALWAYS_SHOW_NEAR_END_PX: 24,
} as const;
