import type { CategoryCode } from './Catalog.types.ts';
import { matchesDiscoveryFilter } from './discoveryFilters.ts';

/** The user's decision on a card: like or skip. */
export type Decision = 'like' | 'skip';

/** The kind filter on the swipe screen: one kind or all. */
export type CategoryFilter = 'all' | CategoryCode;

/** The discover state is stored ON THIS DEVICE (no identity yet, not on the server; docs/ux/data-needs.md 'Selected exists only on the device'). */
export interface DiscoverState {
  /** placeId -> like/skip. */
  readonly decisions: Readonly<Record<string, Decision>>;
  /** The order of the cards already decided, so the last card can be Undone. */
  readonly history: readonly string[];
  /** placeId -> the index of the photo being viewed on the card. */
  readonly photo: Readonly<Record<string, number>>;
  readonly cat: CategoryFilter;
  /** The guide block that is open ('' = all closed). */
  readonly guide: string;
  /** The 'What to bring' items that were ticked (key = the item index). */
  readonly pack: Readonly<Record<string, boolean>>;
  readonly onboarded: boolean;
  /** placeId -> true: a place that was liked and has been saved into a trip (B-06, DR-037). Still a 'like' decision but no longer counted in 'waiting to be saved'. */
  readonly saved: Readonly<Record<string, boolean>>;
}

/** The id of the guide block that is open by default on first entry (Best season). */
export const DEFAULT_GUIDE_OPEN = 'mua';

/** The initial state of a new person. */
export const INITIAL_DISCOVER_STATE: DiscoverState = {
  decisions: {}, history: [], photo: {}, cat: 'all', guide: DEFAULT_GUIDE_OPEN, pack: {}, onboarded: false, saved: {},
};

/** A copy of `saved` without `placeId` (removes the 'already in a trip' mark). */
function withoutSaved(saved: DiscoverState['saved'], placeId: string): DiscoverState['saved'] {
  const { [placeId]: _removed, ...rest } = saved;
  return rest;
}

/** Records the decision for a card; every card goes back to its first photo and into the history so it can be Undone. A new decision clears an old 'already in a trip' mark. */
export function decide(s: DiscoverState, placeId: string, decision: Decision): DiscoverState {
  return {
    ...s,
    decisions: { ...s.decisions, [placeId]: decision },
    history: [...s.history, placeId],
    photo: { ...s.photo, [placeId]: 0 },
    saved: withoutSaved(s.saved, placeId),
  };
}

/** Marks the places that were LIKED as already in a trip; ignores ids that are not liked places. The 'like' decision is kept. */
export function markSaved(s: DiscoverState, ids: readonly string[]): DiscoverState {
  const liked = ids.filter((id) => s.decisions[id] === 'like');
  return liked.length ? { ...s, saved: { ...s.saved, ...Object.fromEntries(liked.map((id) => [id, true])) } } : s;
}

/** Undoes the most recent decided card (nothing to undo keeps the state). */
export function undoLast(s: DiscoverState): DiscoverState {
  const id = s.history[s.history.length - 1];
  if (id === undefined) return s;
  const { [id]: _removed, ...rest } = s.decisions;
  // puts the filter back to 'All': the card just undone may belong to a kind other than the filtered one and would not show
  return { ...s, decisions: rest, history: s.history.slice(0, -1), cat: 'all', saved: withoutSaved(s.saved, id) };
}

/** Deselects a liked place (from 'Selected', from the Undo history, and removes the 'already in a trip' mark). */
export function unpick(s: DiscoverState, placeId: string): DiscoverState {
  const { [placeId]: _removed, ...rest } = s.decisions;
  return { ...s, decisions: rest, history: s.history.filter((h) => h !== placeId), saved: withoutSaved(s.saved, placeId) };
}

/** Removes several places from 'Selected' at once, from the Undo history and from the 'already in a trip' mark. */
export function clearPicked(s: DiscoverState, ids: readonly string[]): DiscoverState {
  const drop = new Set(ids);
  return {
    ...s,
    decisions: Object.fromEntries(Object.entries(s.decisions).filter(([id]) => !drop.has(id))),
    history: s.history.filter((h) => !drop.has(h)),
    saved: Object.fromEntries(Object.entries(s.saved).filter(([id]) => !drop.has(id))),
  };
}

/** Lets every skipped card be seen again (keeping the selected places) and clears the Undo history. */
export function restartSkipped(s: DiscoverState): DiscoverState {
  const kept = Object.fromEntries(Object.entries(s.decisions).filter(([, d]) => d === 'like'));
  return { ...s, decisions: kept, history: [] };
}

/** Sets the index of the photo being viewed of a card. */
export function setPhotoIndex(s: DiscoverState, placeId: string, index: number): DiscoverState {
  return { ...s, photo: { ...s.photo, [placeId]: index } };
}

/** Sets the kind filter. */
export function setCategory(s: DiscoverState, cat: CategoryFilter): DiscoverState {
  return { ...s, cat };
}

/** Opens/closes a guide block (tapping the open block closes it). */
export function toggleGuide(s: DiscoverState, id: string): DiscoverState {
  return { ...s, guide: s.guide === id ? '' : id };
}

/** Ticks/unticks one 'What to bring' item. */
export function togglePack(s: DiscoverState, key: string): DiscoverState {
  return { ...s, pack: { ...s.pack, [key]: !s.pack[key] } };
}

/** The cards left to swipe: not yet decided and matching the kind filter; places with a real photo come before places with no photo (keeping the editorial order within each group). */
export function remainingIds<P extends { id: string; category: CategoryCode; photos?: readonly unknown[] }>(s: DiscoverState, places: readonly P[]): P[] {
  const left = places.filter((p) => matchesDiscoveryFilter(p, s.cat) && !s.decisions[p.id]);
  const hasPhoto = (p: P): boolean => (p.photos?.length ?? 1) > 0;
  return [...left.filter(hasPhoto), ...left.filter((p) => !hasPhoto(p))];
}

/** The selected (liked) places that are NOT in any trip yet, in the editorial catalog's order. Used for the count, the '+' button and 'Save N places'. */
export function pickedOf<P extends { id: string }>(s: DiscoverState, places: readonly P[]): P[] {
  return places.filter((p) => s.decisions[p.id] === 'like' && !s.saved[p.id]);
}

/** The number of places liked and not in any trip yet, counted over every destination (no editorial catalog needed). */
export function pendingPickCount(s: DiscoverState): number {
  return Object.entries(s.decisions).filter(([id, d]) => d === 'like' && !s.saved[id]).length;
}

/** The selected places that ARE already in a trip, in the editorial catalog's order (shown in 'Selected' with a label). */
export function savedPicksOf<P extends { id: string }>(s: DiscoverState, places: readonly P[]): P[] {
  return places.filter((p) => s.decisions[p.id] === 'like' && s.saved[p.id] === true);
}

const CATEGORY_CODES: readonly string[] = ['all', 'canh', 'van', 'am', 'leo', 'luu', 'cho'];

/** Whether it is a plain object (not null, not an array). */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Keeps the key->value pairs whose value satisfies `ok`; drops a broken pair instead of dropping the whole object. */
function pickRecord<V>(raw: unknown, ok: (v: unknown) => v is V): Record<string, V> {
  return isRecord(raw) ? (Object.fromEntries(Object.entries(raw).filter(([, v]) => ok(v))) as Record<string, V>) : {};
}

/**
 * Cleans the discover state read from localStorage (untrusted): the right type for each field, a value from the allowed set;
 * a broken field goes back to the default. Not an object (null, array, string) returns null so the initial state is used.
 */
export function sanitizeDiscoverState(raw: unknown): DiscoverState | null {
  if (!isRecord(raw)) return null;
  const base = INITIAL_DISCOVER_STATE;
  return {
    decisions: pickRecord(raw['decisions'], (v): v is Decision => v === 'like' || v === 'skip'),
    history: Array.isArray(raw['history']) ? raw['history'].filter((h): h is string => typeof h === 'string') : base.history,
    photo: pickRecord(raw['photo'], (v): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0),
    cat: typeof raw['cat'] === 'string' && CATEGORY_CODES.includes(raw['cat']) ? (raw['cat'] as CategoryFilter) : base.cat,
    guide: typeof raw['guide'] === 'string' ? raw['guide'] : base.guide,
    pack: pickRecord(raw['pack'], (v): v is boolean => typeof v === 'boolean'),
    onboarded: raw['onboarded'] === true,
    saved: pickRecord(raw['saved'], (v): v is true => v === true),
  };
}
