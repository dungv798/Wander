const OVERLAY_KEY = 'wanderOverlayRoute';

/** Recognizes the history entry of an overlay sheet on the same URL, keeping the background screen's Back independent. */
export function isOverlayEntry(state: unknown, hash: string): boolean {
  return !!state && typeof state === 'object' && OVERLAY_KEY in state && state[OVERLAY_KEY] === hash;
}

/** Removes the overlay mark but keeps the background screen's state and the navigation depth. */
export function withoutOverlay(state: unknown): Record<string, unknown> {
  const result: Record<string, unknown> = { ...(state && typeof state === 'object' ? state : {}) };
  delete result[OVERLAY_KEY];
  return result;
}

/** Adds an entry for an overlay sheet without increasing the route depth or replacing the existing state. */
export function withOverlay(state: unknown, hash: string): Record<string, unknown> {
  return { ...withoutOverlay(state), [OVERLAY_KEY]: hash };
}
