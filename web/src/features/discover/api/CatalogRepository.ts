import type { DestinationDetail, DestinationSummary } from '../model/Catalog.types.ts';

/**
 * The read port of the editorial catalog (the D of SOLID): the UI only knows this contract, not whether the data comes from a fake file or the real API.
 * The contract matches `/api/catalog/**` of the backend (`CatalogController`).
 */
export interface CatalogRepository {
  /** Finds destinations by name (accent-insensitive); an empty string returns all. */
  searchDestinations(query: string, signal?: AbortSignal): Promise<DestinationSummary[]>;
  /** One full destination; throws `ApiError('NOT_FOUND')` if there is none. */
  destination(id: string, signal?: AbortSignal): Promise<DestinationDetail>;
}
