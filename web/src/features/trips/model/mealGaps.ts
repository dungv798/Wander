import { PersistentStore } from '../../../shared/state/PersistentStore.ts';
import { MEAL_GAPS_COPY as M, MEAL_GAPS_RULES as R } from './mealGaps.copy.ts';
import type { TripItem } from './trip.types.ts';

export type MealGap = 'lunch' | 'dinner' | 'rest';

/** The data that opens the editor from a reminder; not a command to create or save an item. */
export interface MealGapEditor {
  readonly kind: 'editor';
  readonly itemId: null;
  readonly preset: 'food' | 'rest';
  readonly initial: { readonly day: string; readonly title: string; readonly note?: string };
}

/** Attaches the day and the meal/rest name to the draft, inferring no time or price. */
export function mealGapEditor(gap: MealGap, day: string): MealGapEditor {
  return { kind: 'editor', itemId: null, preset: gap === 'rest' ? 'rest' : 'food', initial: { day, title: M[gap].suggestedTitle } };
}
type GapItem = Pick<TripItem, 'day' | 'type' | 'title' | 'placeId' | 'timeOfDay' | 'durationMin'>;
type PlaceLookup = (id: string | null) => { readonly category: string; readonly name: string; readonly venue?: { readonly kind: string } | null } | null;

/** Removes Vietnamese accents, keeping word boundaries so 'An' inside another word is not mistaken. */
function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').replace(/[đĐ]/g, 'd').toLowerCase();
}

/** Reads an entered time as minutes, inferring no time when empty or in the wrong format. */
function minutes(time: string | null): number | null {
  if (!time || !/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(time)) return null;
  const [hour, minute] = time.split(':').map(Number);
  return hour! * R.minutesPerHour + minute!;
}

/** Light recognition by kind, catalog or name; a clear lunch/dinner does not hide the other meal. */
function recognized(item: GapItem, place: PlaceLookup): readonly MealGap[] {
  const p = item.placeId ? place(item.placeId) : null;
  const text = normalize(`${item.title} ${p?.name ?? ''}`);
  const cafe = p?.venue?.kind === 'cafe' || p?.venue?.kind === 'bar' || p?.category === 'cafe' || p?.category === 'coffee';
  const rest = item.type === 'rest' || cafe || /\b(nghi|ca phe|coffee)\b/.test(text);
  const food = item.type === 'food' || R.foodCategories.some((c) => c === p?.category) || /\b(an|com|pho|ca phe|trua|toi)\b/.test(text);
  const result: MealGap[] = rest ? ['rest'] : [];
  if (!food || (rest && item.type !== 'food')) return result;
  const lunch = /\btrua\b/.test(text);
  const dinner = /\btoi\b/.test(text);
  if (lunch) result.push('lunch');
  if (dinner) result.push('dinner');
  if (!lunch && !dinner) {
    const time = minutes(item.timeOfDay);
    if (time === null) result.push('lunch', 'dinner');
    else if (time >= R.eveningStart) result.push('dinner');
    else if (time >= R.noonStart && time <= R.noonEnd) result.push('lunch');
  }
  return result;
}

/** Finds the missing gap of exactly that day; it only reads the real time/duration, and adds or schedules no item. */
export function mealGaps(items: readonly GapItem[], day: string, place: PlaceLookup, dismissed: readonly MealGap[] = []): MealGap[] {
  const selected = items.filter((i) => i.day === day);
  const occupied = new Set(selected.flatMap((i) => recognized(i, place)));
  const sights = selected.filter((i) => (i.type === 'sightseeing' || i.type === 'tour') && recognized(i, place).length === 0);
  if (!sights.length) return [];
  const starts = selected.flatMap((i) => { const t = minutes(i.timeOfDay); return t === null ? [] : [t]; });
  const ends = selected.flatMap((i) => { const t = minutes(i.timeOfDay); return t === null ? [] : [t + (i.durationMin ?? 0)]; });
  const spansNoon = starts.length > 0 && Math.min(...starts) <= R.noonStart && Math.max(...ends) >= R.noonEnd;
  const candidates: MealGap[] = [];
  if (sights.length >= R.lunchPlaces || spansNoon) candidates.push('lunch');
  if (ends.some((t) => t >= R.eveningStart)) candidates.push('dinner');
  if (sights.length >= R.restPlaces) candidates.push('rest');
  return candidates.filter((gap) => !occupied.has(gap) && !dismissed.includes(gap));
}

/** A key specific to the trip and the day; it stores no identity or schedule data. */
export function mealGapStorageKey(tripId: string, day: string): string {
  return `${R.storagePrefix}:${tripId}:${day}`;
}

/** Reads the closed state; broken or blocked storage does not stop viewing the schedule. */
export function readMealGapDismissals(key: string): MealGap[] {
  try {
    const saved: unknown = JSON.parse(PersistentStore.readRaw(key) ?? '[]');
    return Array.isArray(saved) ? saved.filter((v): v is MealGap => v === 'lunch' || v === 'dinner' || v === 'rest') : [];
  } catch { return []; }
}

/** Stores the choice to close; it can still be closed within the session if the browser does not allow writing. */
export function saveMealGapDismissals(key: string, gaps: readonly MealGap[]): void {
  try { PersistentStore.writeRaw(key, JSON.stringify(gaps)); } catch { /* A light reminder does not block the schedule. */ }
}
