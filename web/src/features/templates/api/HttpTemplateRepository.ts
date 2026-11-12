import { ApiError } from '../../../shared/api/ApiError.ts';
import type { ApiClient } from '../../../shared/api/ApiClient.ts';
import { CLIENT_ERROR, HTTP } from '../../../shared/api/http.const.ts';
import type { TemplateRepository } from './TemplateRepository.ts';
import { TEMPLATES_API } from './templatesApi.const.ts';

/** Whether it is a plain object (not null, not an array). */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** A day from the API (`placeIds`, `note`) into the raw form that the UI's template mapper reads (`places`, `note`); missing `placeIds` => an empty list. */
function toRawDay(day: unknown): unknown {
  if (!isRecord(day)) return day;
  const { placeIds, ...rest } = day;
  return { ...rest, places: Array.isArray(placeIds) ? placeIds : [] };
}

/** A template from the API into the raw form; an element that is not an object is dropped (returns null to filter). */
function toRawTemplate(template: unknown): Record<string, unknown> | null {
  if (!isRecord(template)) return null;
  const days = template['days'];
  return { ...template, days: Array.isArray(days) ? days.map(toRawDay) : days };
}

/**
 * The repository that reads sample itineraries from `GET /api/catalog/destinations/{id}/templates` (public). The API returns `days[].placeIds`; the UI reads
 * `days[].places` so the key is changed here, while the checks and joining with the place catalog are still done by `toTemplateViews`.
 * The result is REMEMBERED by destination (several screens need it); an error is not remembered so it can be retried.
 */
export class HttpTemplateRepository implements TemplateRepository {
  private readonly client: ApiClient;
  private readonly cache = new Map<string, Promise<unknown>>();

  /** Uses the given HTTP client (injectable in tests). */
  constructor(client: ApiClient) {
    this.client = client;
  }

  /** The raw sample itineraries of a destination; a destination that does not exist (404) or has no itinerary yet is not an error. The request is shared so it does not accept each caller's cancel signal. */
  templates(destId: string): Promise<unknown> {
    const hit = this.cache.get(destId);
    if (hit) return hit;
    const request = this.fetchTemplates(destId);
    this.cache.set(destId, request);
    request.catch(() => this.cache.delete(destId));
    return request;
  }

  /** Calls the sample-itinerary API and changes it to the UI's raw form. */
  private async fetchTemplates(destId: string): Promise<unknown> {
    let body: unknown;
    try {
      body = await this.client.get<unknown>(`${TEMPLATES_API.DESTINATIONS}/${encodeURIComponent(destId)}${TEMPLATES_API.SUFFIX}`);
    } catch (e) {
      if (e instanceof ApiError && e.status === HTTP.NOT_FOUND) return {};
      throw e;
    }
    const list = isRecord(body) ? body['templates'] : undefined;
    if (!Array.isArray(list)) throw new ApiError(CLIENT_ERROR.INTERNAL);
    return { templates: list.map(toRawTemplate).filter((t) => t !== null) };
  }
}
