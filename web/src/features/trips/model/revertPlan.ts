import type { DayAssignment, ItemChange, ScheduleChange, TripPatch } from '../api/TripsGateway.ts';
import type { Trip, TripItem } from './trip.types.ts';

/** The content fields of an item that Undo restores (the day and order have their own schedule command). */
const CONTENT_FIELDS = ['type', 'title', 'timeOfDay', 'durationMin', 'note', 'costK', 'included', 'referenceK', 'booking'] as const;

/** The content-edit command for the shared items: for each item, whichever fields differ before/after, exactly those fields are restored. */
function contentEdits(before: Trip, after: Trip): RevertStep[] {
  const afterById = new Map(after.items.map((i) => [i.id, i]));
  const steps: RevertStep[] = [];
  for (const b of before.items) {
    const a = afterById.get(b.id);
    if (!a) continue;
    const change: Record<string, unknown> = {};
    for (const f of CONTENT_FIELDS) if (a[f] !== b[f]) change[f] = b[f];
    if (Object.keys(change).length) steps.push({ kind: 'edit', itemId: b.id, change: change as ItemChange });
  }
  return steps;
}

/** One inverse command of Undo, run in sequence on the server. */
export type RevertStep =
  | { readonly kind: 'schedule'; readonly change: ScheduleChange }
  | { readonly kind: 'restore'; readonly itemId: string }
  | { readonly kind: 'trash'; readonly itemId: string }
  | { readonly kind: 'patch'; readonly patch: TripPatch }
  | { readonly kind: 'edit'; readonly itemId: string; readonly change: ItemChange }
  | { readonly kind: 'discard'; readonly itemId: string };

/** The set of item ids by day (null = 'No date yet'); used to know which day was only reordered or had items going in/out. */
function idsByDay(items: readonly TripItem[]): Map<string | null, Set<string>> {
  const map = new Map<string | null, Set<string>>();
  for (const i of items) map.set(i.day, (map.get(i.day) ?? new Set<string>()).add(i.id));
  return map;
}

/** Whether two sets have the same elements. */
function sameSet(a: ReadonlySet<string> | undefined, b: ReadonlySet<string> | undefined): boolean {
  return a !== undefined && b !== undefined && a.size === b.size && [...a].every((x) => b.has(x));
}

/** The command that re-assigns the day/position of the shared items: a day change re-assigns; the same day is re-assigned only when that day was purely reordered (with items going in/out the rank change is only from compaction, do NOT overwrite). */
function assignmentsToRevert(before: Trip, after: Trip): DayAssignment[] {
  const afterById = new Map(after.items.map((i) => [i.id, i]));
  const beforeDays = idsByDay(before.items);
  const afterDays = idsByDay(after.items);
  const out: DayAssignment[] = [];
  for (const b of before.items) {
    const a = afterById.get(b.id);
    if (!a) continue;
    const movedDay = a.day !== b.day;
    const pureReorder = !movedDay && a.position !== b.position && sameSet(beforeDays.get(b.day), afterDays.get(b.day));
    if (!movedDay && !pureReorder) continue;
    out.push(b.day === null ? { itemId: b.id, day: null } : { itemId: b.id, day: b.day, ...(b.position === null ? {} : { position: b.position }) });
  }
  return out;
}

/**
 * The inverse command that puts the trip `after` (re-read from the server) back to `before`: the date range + the day/order assignment (one atomic schedule command), then restores
 * the content of the edited items, restores the items that were soft-deleted, soft-deletes again the items that were just restored (a completely new item is dropped entirely), and finally
 * the PATCH of the name and the 'tentative' label. Returns an empty list if nothing else differs.
 */
export function revertPlan(before: Trip, after: Trip): RevertStep[] {
  const steps: RevertStep[] = [];
  const change: { startDate?: string; endDate?: string; assignments?: DayAssignment[] } = {};
  if (before.startDate !== after.startDate || before.endDate !== after.endDate) {
    change.startDate = before.startDate;
    change.endDate = before.endDate;
  }
  const assignments = assignmentsToRevert(before, after);
  if (assignments.length) change.assignments = assignments;
  if (Object.keys(change).length) steps.push({ kind: 'schedule', change });
  steps.push(...contentEdits(before, after));
  const afterLive = new Set(after.items.map((i) => i.id));
  const beforeLive = new Set(before.items.map((i) => i.id));
  for (const id of beforeLive) if (!afterLive.has(id) && after.trash.some((t) => t.id === id)) steps.push({ kind: 'restore', itemId: id });
  for (const id of afterLive) {
    if (beforeLive.has(id)) continue;
    steps.push({ kind: before.trash.some((t) => t.id === id) ? 'trash' : 'discard', itemId: id });
  }
  const patch: { name?: string; datesTentative?: boolean; cover?: Trip['cover'] } = {};
  if (JSON.stringify(before.cover ?? null) !== JSON.stringify(after.cover ?? null)) patch.cover = before.cover ?? null;
  if (before.name !== after.name) patch.name = before.name;
  if (before.datesTentative !== after.datesTentative) patch.datesTentative = before.datesTentative;
  if (Object.keys(patch).length) steps.push({ kind: 'patch', patch });
  return steps;
}
