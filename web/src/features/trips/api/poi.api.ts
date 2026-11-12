import type { ApiClient } from '../../../shared/api/ApiClient.ts';
import { ApiError } from '../../../shared/api/ApiError.ts';
import { apiClient } from '../../../shared/api/defaultClient.ts';
import { MEAL_SUGGEST as R } from '../model/mealSuggest.const.ts';

/** A broad POI is used only as a free-form draft; distanceM is the unrounded straight-line distance in meters. */
export interface PoiSuggestion {
  readonly id: string;
  readonly name: string;
  readonly kind: 'food' | 'cafe' | 'fast_food' | 'bar' | 'other';
  readonly lat: number;
  readonly lon: number;
  readonly distanceM: number;
  readonly address: string | null;
  readonly openingHoursRaw: string | null;
  readonly openingHoursStatus: 'RAW' | 'UNKNOWN';
  readonly phone: string | null;
  readonly website: string | null;
  readonly verificationStatus: 'SNAPSHOT_UNVERIFIED';
  readonly attribution: { readonly sourceKind: string; readonly sourceUrl: string; readonly snapshotAt: string; readonly license: string; readonly licenseUrl: string; readonly credit: string };
}

/** Confirms the minimal shape before displaying; the raw hours and address are kept as they are, not parsed. */
function isPoi(value: unknown): value is PoiSuggestion {
  if (!value || typeof value !== 'object') return false;
  const p = value as Record<string, unknown>;
  const nullableText = ['address', 'openingHoursRaw', 'phone', 'website'].every(k => p[k] === null || typeof p[k] === 'string');
  const attribution = p['attribution'] as Record<string, unknown> | null;
  return typeof p['id'] === 'string' && typeof p['name'] === 'string' && p['name'].trim().length > 0
    && ['food', 'cafe', 'fast_food', 'bar', 'other'].includes(String(p['kind']))
    && ['lat', 'lon', 'distanceM'].every(k => typeof p[k] === 'number' && Number.isFinite(p[k])) && (p['distanceM'] as number) >= 0
    && nullableText && ['RAW', 'UNKNOWN'].includes(String(p['openingHoursStatus'])) && p['verificationStatus'] === 'SNAPSHOT_UNVERIFIED'
    && !!attribution && ['sourceKind', 'sourceUrl', 'snapshotAt', 'license', 'licenseUrl', 'credit'].every(k => typeof attribution[k] === 'string');
}

/** The contract for reading POIs publicly through the shared ApiClient; the client is injected to try network errors and cancelling. */
export class PoiApi {
  private readonly client: ApiClient;

  /** Uses the shared client, and creates no new fetch or session mechanism of its own. */
  constructor(client: ApiClient = apiClient) { this.client = client; }

  /** Gets at most 12 venues within a radius in meters; a broken response is a clear error instead of a fake empty list. */
  async nearby(destination: string, kind: 'food' | 'cafe' | 'rest' | 'all', near: { readonly lat: number; readonly lon: number }, radiusM: number = R.radiusM, signal?: AbortSignal): Promise<readonly PoiSuggestion[]> {
    const query = new URLSearchParams({ kind, near: `${near.lat},${near.lon}`, radiusM: String(radiusM), limit: String(R.limit) });
    const body = await this.client.get<{ poi?: unknown }>(`/api/catalog/destinations/${encodeURIComponent(destination)}/poi?${query}`, signal);
    if (!body || !Array.isArray(body.poi) || !body.poi.every(isPoi)) throw new ApiError('INTERNAL');
    return body.poi.slice().sort((a, b) => a.distanceM - b.distanceM || a.id.localeCompare(b.id));
  }
}
