import { PersistentStore } from '../../../shared/state/PersistentStore.ts';
import { DEFAULT_DESTINATION_ID } from '../../../shared/const/routes.const.ts';
import { normalizeSearch } from '../../../shared/lib/text.ts';
import { DESTINATION_ID_PATTERN, DESTINATION_STORAGE_KEY } from './destination.const.ts';

interface SearchableDestination { readonly id: string; readonly name: string; readonly region: string }
type DestinationStorage = Pick<Storage, 'getItem' | 'setItem'>;

/** Tells a real choice from a technical fallback code; while the catalog is loading a well-formed code is still kept. */
export function selectedDestination(saved: unknown, destinations?: readonly { readonly id: string }[]): string | null {
  if (typeof saved !== 'string' || !DESTINATION_ID_PATTERN.test(saved)) return null;
  return destinations === undefined || destinations.some(destination => destination.id === saved) ? saved : null;
}

/** Matches the name or region without accents, keeping the editorial order. */
export function filterDestinations<T extends SearchableDestination>(destinations: readonly T[], query: string): T[] {
  const normalized = normalizeSearch(query);
  return destinations.filter((destination) => normalizeSearch(destination.name).includes(normalized) || normalizeSearch(destination.region).includes(normalized));
}

/** Catalog not loaded yet (undefined): use the well-formed saved code immediately; loaded, even empty: validate that it exists before falling back. */
export function resolveDestination(saved: unknown, destinations: readonly { readonly id: string }[] | undefined): string {
  if (destinations === undefined) return typeof saved === 'string' && DESTINATION_ID_PATTERN.test(saved) ? saved : DEFAULT_DESTINATION_ID;
  const has = (id: unknown): string | undefined => destinations.find((destination) => destination.id === id)?.id;
  return has(saved) ?? has(DEFAULT_DESTINATION_ID) ?? destinations[0]?.id ?? DEFAULT_DESTINATION_ID;
}

/** Reads the choice, even when the browser blocks access to localStorage. */
export function readDestination(storage?: DestinationStorage): string | null {
  try { return PersistentStore.readRaw(DESTINATION_STORAGE_KEY, storage); } catch { return null; }
}

/** Writes the choice on a best-effort basis, without blocking a screen change when storage is full. */
export function writeDestination(storage: DestinationStorage | undefined, id: string): void {
  try { PersistentStore.writeRaw(DESTINATION_STORAGE_KEY, id, storage); } catch { /* Still usable in the current session. */ }
}
