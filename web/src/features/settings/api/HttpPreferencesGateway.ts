import { ApiError } from '../../../shared/api/ApiError.ts';
import type { ApiClient } from '../../../shared/api/ApiClient.ts';
import { CLIENT_ERROR } from '../../../shared/api/http.const.ts';
import { PREFERENCES_API as P } from './preferencesApi.const.ts';

/** The code in a `{code,label}` element; a broken element gives null. */
function codeOf(v: unknown): string | null {
  return typeof v === 'object' && v !== null && typeof (v as { code?: unknown }).code === 'string' ? (v as { code: string }).code : null;
}

/** The list of interest codes from the response body `{interests:[{code,label}]}`; missing/wrong shape is an internal error, a broken element is dropped. */
function interestCodes(body: unknown): string[] {
  const list = typeof body === 'object' && body !== null ? (body as Record<string, unknown>)[P.KEY_INTERESTS] : undefined;
  if (!Array.isArray(list)) throw new ApiError(CLIENT_ERROR.INTERNAL);
  return list.map(codeOf).filter((c): c is string => c !== null);
}

/** Reads/writes the 'What are you into?' interests of the identity owner (stored per identity so they remain on another device). Every failure is an `ApiError` with the backend's code. */
export class HttpPreferencesGateway {
  private readonly client: ApiClient;

  /** Uses the given HTTP client (injectable in tests). */
  constructor(client: ApiClient) {
    this.client = client;
  }

  /** The codes of the interest kinds currently stored (empty if none chosen). */
  async interests(): Promise<string[]> {
    return interestCodes(await this.client.get<unknown>(P.ROOT));
  }

  /** Replaces ALL interests with `codes` (empty = clear) and returns the list normalized by the server (duplicates dropped, sorted). */
  async saveInterests(codes: readonly string[]): Promise<string[]> {
    return interestCodes(await this.client.send<unknown>('PUT', P.INTERESTS, { [P.KEY_INTERESTS]: codes }));
  }
}
