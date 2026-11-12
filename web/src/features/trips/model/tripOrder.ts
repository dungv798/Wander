import type { Trip, TripsState } from './trip.types.ts';

/** Sorts the trip list like the server (`startDate` newest first, ties by later creation first) so the order within the session matches after a reload. */
export function sortTrips(trips: readonly Trip[]): Trip[] {
  return [...trips].sort((a, b) => (a.startDate === b.startDate ? b.createdAt - a.createdAt : a.startDate < b.startDate ? 1 : -1));
}

/**
 * Merges the loaded whole list (`loaded`, starting from when the store was `started`) with the current store (`current`) after a write action came in between:
 * a trip that was re-read after `started` (or newly created) keeps the copy in the store because it is newer; the other trips are taken from the loaded copy. A trip that was in
 * `started` but is no longer in `loaded` (deleted on another device) is dropped.
 */
export function mergeLoaded(started: TripsState, current: TripsState, loaded: readonly Trip[]): Trip[] {
  const startedById = new Map(started.trips.map((t) => [t.id, t]));
  const newer = new Map(current.trips.filter((t) => startedById.get(t.id) !== t).map((t) => [t.id, t]));
  const merged = loaded.map((t) => newer.get(t.id) ?? t);
  const known = new Set(loaded.map((t) => t.id));
  for (const t of newer.values()) if (!known.has(t.id) && !startedById.has(t.id)) merged.push(t);
  return sortTrips(merged);
}
