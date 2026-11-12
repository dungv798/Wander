/** The values of the address suffix of a trip: overview, unscheduled, cost; the rest is the day number (Schedule). */
export const TRIP_TAB = { OVERVIEW: 'ov', UNASSIGNED: 'un', COST: 'cost' } as const;

/** The four view modes of a trip; choosing a DAY exists only in the Schedule mode. */
export type TripMode = 'overview' | 'schedule' | 'unassigned' | 'cost';

/** The order of the modes on the mode bar. */
export const TRIP_MODES: readonly TripMode[] = ['overview', 'schedule', 'unassigned', 'cost'];

/** A valid address suffix: `ov`/`un`/`cost` or a day number 1..n; a wrong one goes to the overview (old addresses `ov` and `<n>` still open as before). */
export function validTab(sub: string | null, dayCount: number): string {
  if (sub === TRIP_TAB.UNASSIGNED || sub === TRIP_TAB.COST || sub === TRIP_TAB.OVERVIEW) return sub;
  const n = Number(sub);
  return sub && Number.isInteger(n) && n >= 1 && n <= dayCount ? String(n) : TRIP_TAB.OVERVIEW;
}

/** The view mode that corresponds to an address suffix already checked by `validTab`. */
export function modeOfTab(tab: string): TripMode {
  if (tab === TRIP_TAB.UNASSIGNED) return 'unassigned';
  if (tab === TRIP_TAB.COST) return 'cost';
  return tab === TRIP_TAB.OVERVIEW ? 'overview' : 'schedule';
}

/** The address suffix to enter a mode: Schedule goes back to the most recently viewed day (day 1 by default). */
export function tabOfMode(mode: TripMode, lastDay: string): string {
  if (mode === 'overview') return TRIP_TAB.OVERVIEW;
  if (mode === 'unassigned') return TRIP_TAB.UNASSIGNED;
  if (mode === 'cost') return TRIP_TAB.COST;
  return lastDay;
}
