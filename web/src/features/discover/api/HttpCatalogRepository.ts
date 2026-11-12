import { ApiError } from '../../../shared/api/ApiError.ts';
import type { ApiClient } from '../../../shared/api/ApiClient.ts';
import { CLIENT_ERROR } from '../../../shared/api/http.const.ts';
import type { DestinationDetail, DestinationSummary } from '../model/Catalog.types.ts';
import { CATALOG_API, CATALOG_CATEGORIES } from './catalogApi.const.ts';
import type { CatalogRepository } from './CatalogRepository.ts';
import { parseMoments } from '../model/moments.ts';
import { isVenueView } from '../model/venue.ts';
import { loadCachedDestination, saveCachedDestination } from '../model/destinationCache.ts';

/** An HTTP status from here up means the server failed or is not ready (gateway 502/503 while the server is asleep). */
const SERVER_ERROR_FROM = 500;

/** Whether it is a plain object (not null, not an array). */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** A minimally valid summary: it has an id, a name and a region as strings (enough for the list and the card to render without crashing). */
function isSummary(v: unknown): v is DestinationSummary {
  return isRecord(v) && typeof v['id'] === 'string' && typeof v['name'] === 'string' && typeof v['region'] === 'string'
    && (v['lat'] === null || (typeof v['lat'] === 'number' && Number.isFinite(v['lat'])))
    && (v['lon'] === null || (typeof v['lon'] === 'number' && Number.isFinite(v['lon'])))
    && (v['categories'] === undefined || (Array.isArray(v['categories']) && v['categories'].every(category => typeof category === 'string' && CATALOG_CATEGORIES.includes(category))));
}

/** A minimally valid full destination: the id and name are strings; the places, guide and reference landmarks are arrays (the screens loop over them when rendering). */
function isDetail(v: unknown): v is DestinationDetail {
  return isRecord(v) && typeof v['id'] === 'string' && typeof v['name'] === 'string'
    && Array.isArray(v['places']) && Array.isArray(v['guide']) && Array.isArray(v['references']);
}

/**
 * The repository that reads `/api/catalog/**` of the backend (public, no session needed). The data contract matches `CatalogViews` so it is returned as is, only
 * the minimal shape is checked: a wrong body becomes `ApiError('INTERNAL')` instead of letting a broken value flow into the UI and blank the screen.
 * A destination is REMEMBERED by id (several screens need the same destination); an error is not remembered so it can be retried.
 */
export class HttpCatalogRepository implements CatalogRepository {
  private readonly client: ApiClient;
  private readonly cache = new Map<string, Promise<DestinationDetail>>();

  /** Uses the given HTTP client (injectable in tests). */
  constructor(client: ApiClient) {
    this.client = client;
  }

  /** Finds destinations by name or region; an empty string (or only whitespace) sends no parameter and returns all. Not remembered because the search string changes constantly. */
  async searchDestinations(query: string, signal?: AbortSignal): Promise<DestinationSummary[]> {
    const q = query.trim();
    const path = q ? `${CATALOG_API.DESTINATIONS}?${CATALOG_API.QUERY_PARAM}=${encodeURIComponent(q)}` : CATALOG_API.DESTINATIONS;
    const body = await this.client.get<unknown>(path, signal);
    const list = isRecord(body) ? body['destinations'] : undefined;
    if (!Array.isArray(list) || !list.every(isSummary)) throw new ApiError(CLIENT_ERROR.INTERNAL);
    return list;
  }

  /**
   * One full destination by id; the backend returns 404 `NOT_FOUND` when there is none. The request is shared between several callers so it does NOT
   * attach one caller's cancel signal to `fetch` (a cancel would break the other callers' request); a cancelled caller only receives `AbortError`.
   */
  async destination(id: string, signal?: AbortSignal): Promise<DestinationDetail> {
    const detail = await this.cached(id);
    signal?.throwIfAborted();
    return detail;
  }

  /** Gets (or creates) the shared request for one destination; an error is removed from memory so the next call retries. */
  private cached(id: string): Promise<DestinationDetail> {
    const hit = this.cache.get(id);
    if (hit) return hit;
    const request = this.fetchDestination(id);
    this.cache.set(id, request);
    request.catch(() => this.cache.delete(id));
    return request;
  }

  /**
   * The latest destination: calls the API and remembers that copy on this device; when the server does not answer (lost connection or a 5xx error) and a remembered copy exists it is used so the trip and the 'Today' screen
   * still open (B-09). Other errors (not found, a wrong-shaped body) do not use the remembered copy.
   */
  private async fetchDestination(id: string): Promise<DestinationDetail> {
    try {
      const detail = await this.requestDestination(id);
      saveCachedDestination(detail, Date.now());
      return detail;
    } catch (error) {
      const unreachable = error instanceof ApiError && (error.isNetwork || (error.status !== null && error.status >= SERVER_ERROR_FROM));
      const kept = unreachable ? loadCachedDestination(id) : null;
      if (kept) return kept;
      throw error;
    }
  }

  /** Calls the API for one destination and checks the shape. */
  private async requestDestination(id: string): Promise<DestinationDetail> {
    const body = await this.client.get<unknown>(`${CATALOG_API.DESTINATIONS}/${encodeURIComponent(id)}`);
    const detail = isRecord(body) ? body['destination'] : undefined;
    if (!isDetail(detail)) throw new ApiError(CLIENT_ERROR.INTERNAL);
    if (detail.places.some(place => place.venue != null && !isVenueView(place.venue))) throw new ApiError(CLIENT_ERROR.INTERNAL);
    return { ...detail, moments: parseMoments(detail.moments) };
  }
}
