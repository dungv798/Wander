import type { PoiSuggestion } from '../api/poi.api.ts';
import type { MealGap } from './mealGaps.ts';
import type { MealAnchor } from './mealSuggest.ts';
import type { TripItem } from './trip.types.ts';
import type { TripCatalog } from './tripView.ts';

/** The display kind of a venue after cross-checking the name: the source labels it a restaurant but the name is a coffee/tea shop, so it counts as a coffee shop. */
export type PoiKind = PoiSuggestion['kind'];

/** Names of common coffee/tea chains; only to correct the display kind label, not to invent venue information. */
const COFFEE_NAME = /\b(coffee|cafe|caphe|ca phe|cà phê|highland|highlands|trà|tra sua|trà sữa|tea|milk tea|phuc long|the coffee house)\b/iu;

/** Removes accents to compare names ('Ca phe' matches the accented form). */
function plain(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/gi, 'd').toLowerCase();
}

/** The display kind label: a coffee/tea name is a coffee shop even if the source says restaurant; otherwise the source kind is kept. */
export function displayKind(poi: Pick<PoiSuggestion, 'kind' | 'name'>): PoiKind {
  if (poi.kind === 'food' && COFFEE_NAME.test(plain(poi.name))) return 'cafe';
  return poi.kind;
}

/** The order of venue kinds preferred by meal: a main meal prefers restaurants, rest prefers coffee. A kind not in the list goes last. */
const KIND_ORDER: Readonly<Record<MealGap, readonly PoiKind[]>> = { lunch: ['food', 'fast_food', 'cafe'], dinner: ['food', 'fast_food', 'cafe'], rest: ['cafe', 'food', 'fast_food'] };

/** The rank of a kind for a meal; lower = earlier. */
function kindRank(kind: PoiKind, gap: MealGap): number {
  const index = KIND_ORDER[gap].indexOf(kind);
  return index < 0 ? KIND_ORDER[gap].length : index;
}

/** Sorts the venues for a meal: the right kind first, then the nearer; it removes no venue (only reorders). */
export function rankPoi(list: readonly PoiSuggestion[], gap: MealGap): PoiSuggestion[] {
  return [...list].sort((a, b) => kindRank(displayKind(a), gap) - kindRank(displayKind(b), gap) || a.distanceM - b.distanceM || a.id.localeCompare(b.id));
}

const METERS_PER_KM = 1000;
const ROUND_METERS = 10;
const TENTH_KM_METERS = 100;
const MIN_METERS = 10;

/** A readable distance: under 1 km it is meters rounded to 10, from 1 km it is km with one decimal place (a comma). */
export function formatDistance(meters: number): string {
  if (meters < METERS_PER_KM) return `${Math.max(MIN_METERS, Math.round(meters / ROUND_METERS) * ROUND_METERS)} m`;
  return `${(Math.round(meters / TENTH_KM_METERS) / ROUND_METERS).toString().replace('.', ',')} km`;
}

const MIN_FOR_CENTROID = 2;

/** A landmark that can be chosen to look for venues nearby. */
export interface AnchorOption extends MealAnchor { readonly key: string }

/** The landmarks with coordinates in the day in schedule order, for the user to choose 'near which point'; `centroid` is the centroid of those points (if more than one). */
export function dayAnchors(items: readonly Pick<TripItem, 'day' | 'placeId' | 'position'>[], day: string, place: TripCatalog['place'], centroidName: string): AnchorOption[] {
  const points = items.filter((i) => i.day === day).slice().sort((a, b) => (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER)).flatMap((i) => {
    const p = place(i.placeId);
    return p && p.lat !== null && p.lon !== null && Number.isFinite(p.lat) && Number.isFinite(p.lon) ? [{ key: `item:${i.placeId}`, lat: p.lat, lon: p.lon, name: p.name }] : [];
  });
  if (points.length < MIN_FOR_CENTROID) return points;
  const lat = points.reduce((s, p) => s + p.lat, 0) / points.length;
  const lon = points.reduce((s, p) => s + p.lon, 0) / points.length;
  return [...points, { key: 'centroid', lat, lon, name: centroidName }];
}
