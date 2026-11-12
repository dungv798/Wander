import { normalizeSearch } from '../../../shared/lib/text.ts';
import { TREK_CATEGORY } from './trekking.ts';

interface SearchablePlace {
  readonly name: string;
  readonly categoryName: string;
  readonly area: string;
  readonly hook: string;
  /** The kind code (optional): to search by synonyms of the kind, for example 'trekking' -> Hiking. */
  readonly category?: string;
}

/** Synonyms (normalized without accents) that users often type for a kind; only the hiking/trekking kind has them. */
const CATEGORY_ALIASES: Readonly<Record<string, readonly string[]>> = {
  [TREK_CATEGORY]: ['trekking', 'trek', 'hiking', 'hike', 'leo nui', 'treking'],
};

/** The query is a prefix/substring of a synonym of this place's kind. */
function matchesAlias(place: SearchablePlace, q: string): boolean {
  return (CATEGORY_ALIASES[place.category ?? ''] ?? []).some((alias) => alias.includes(q));
}

/** The maximum number of place results shown at once on the search screen. */
export const PLACE_SEARCH_LIMIT = 30;

/**
 * Searches the places of ONE destination by name, kind, area or a short characteristic (accent-insensitive, case-insensitive).
 * An empty query returns the list in editorial order. A name match is ranked before matches in other fields.
 */
export function searchPlaces<T extends SearchablePlace>(places: readonly T[], query: string): T[] {
  const q = normalizeSearch(query);
  if (!q) return [...places];
  const byName = places.filter((p) => normalizeSearch(p.name).includes(q));
  const others = places.filter((p) => !byName.includes(p) && ([p.categoryName, p.area, p.hook].some((f) => normalizeSearch(f).includes(q)) || matchesAlias(p, q)));
  return [...byName, ...others];
}
