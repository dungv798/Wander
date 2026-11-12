/** The parameters of the estimated route; sizes in px, durations in ms. */
export const ROUTE = {
  HIT_LAYER: 'wander-route-hit',
  ARROW_LAYER: 'wander-route-arrows',
  ARROW_IMAGE: 'wander-route-arrow',
  HIT_WIDTH: 28,
  OPACITY: 0.6,
  DASH: [2, 2],
  ARROW_PX: 24,
  ARROW_START: 6,
  ARROW_MIDDLE: 12,
  ARROW_END: 18,
  ARROW_STROKE: 3,
  ARROW_SPACING: 80,
  DRAW_MS: 850,
  HALF: 2,
  TOKENS: ['--map-route', '--sky', '--like', '--brand-ink', '--skip', '--ink-fixed'],
} as const;
