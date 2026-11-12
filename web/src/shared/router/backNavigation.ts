import { VIEW } from '../const/routes.const.ts';
import type { ViewName } from '../const/routes.const.ts';

const HISTORY_KEY = 'wanderRouteDepth';
const TRIP_PARENTS: readonly ViewName[] = [VIEW.TRIP, VIEW.TODAY];

/** Goes back only within the marked Wander history; a link opened directly always has an internal way out. */
export function routeDepth(state: unknown): number {
  if (!state || typeof state !== 'object' || !(HISTORY_KEY in state)) return 0;
  const value = state[HISTORY_KEY];
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : 0;
}

/** Keeps the browser state when attaching the depth, not using history.length because it can contain an outside page. */
export function withRouteDepth(state: unknown, depth: number): Record<string, unknown> {
  return { ...(state && typeof state === 'object' ? state : {}), [HISTORY_KEY]: depth };
}

/** A child screen opened directly uses the right parent screen; Today with no id goes back to the trip list. */
export function parentRoute(view: ViewName, id: string | null): { view: ViewName; id?: string } {
  if ((view === VIEW.TODAY || view === VIEW.EXPORT) && id) return { view: VIEW.TRIP, id };
  if (TRIP_PARENTS.includes(view)) return { view: VIEW.TRIPS };
  return { view: VIEW.EXPLORE };
}
