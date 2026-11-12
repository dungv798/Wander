import { ApiError } from './ApiError.ts';
import { ABORT_ERROR_NAME, CLIENT_ERROR, HEADER, HTTP } from './http.const.ts';

/** The minimal part of `fetch` that `ApiClient` needs (injectable in tests). */
export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/** The source of extra headers for EACH call (for example `Authorization: Bearer ...`); called again each time so a changed secret takes effect at once. */
export type HeaderSource = () => Record<string, string>;

/** The minimal part of the call tracker that `ApiClient` needs: reports start, returns a function that reports end (B-05). */
export interface RequestObserver {
  readonly begin: () => () => void;
}

/** Whether it is a cancel error: `AbortError` of `fetch`/`json()`, or any error when `signal` has been aborted (cancelling with `abort(reason)` throws the reason itself). */
function isAbort(e: unknown, signal?: AbortSignal): boolean {
  if (signal?.aborted) return true;
  return typeof e === 'object' && e !== null && (e as { name?: unknown }).name === ABORT_ERROR_NAME;
}

/** An error from an unsuccessful response: takes the code from the backend's `application/problem+json` (RFC 9457) body, the `code` member; an unreadable body => `INTERNAL`. It never exposes the raw message; a cancel while reading the body is rethrown. */
async function toApiError(res: Response, signal?: AbortSignal): Promise<ApiError> {
  try {
    const body = (await res.json()) as { code?: unknown } | null;
    const code = body?.code;
    if (typeof code === 'string' && code) return new ApiError(code, res.status);
  } catch (e) {
    if (isAbort(e, signal)) throw e;
    // the body is not JSON (a proxy gateway returned HTML...): falls through to INTERNAL below
  }
  return new ApiError(CLIENT_ERROR.INTERNAL, res.status);
}

/**
 * The UI's single HTTP client: calls `/api/**` with JSON, turns every failure into an `ApiError` with a code (matching
 * `docs/ux/error-codes.md`) so the screen picks a Vietnamese hint. A cancel by `AbortSignal` (at the call step or while reading the body) is
 * rethrown as it is, never mistaken for a network error or a server error.
 * Injects `fetch` and the header source to test without a network.
 */
export class ApiClient {
  private readonly fetchImpl: FetchLike;
  private readonly extraHeaders: HeaderSource;
  private readonly observer: RequestObserver | undefined;

  /** Creates the client; by default it uses the browser's `fetch` and adds no header. */
  constructor(fetchImpl: FetchLike = (input, init) => fetch(input, init), extraHeaders: HeaderSource = () => ({}), observer?: RequestObserver) {
    this.fetchImpl = fetchImpl;
    this.extraHeaders = extraHeaders;
    this.observer = observer;
  }

  /** GETs a path and returns the parsed JSON. */
  get<T>(path: string, signal?: AbortSignal): Promise<T> {
    return this.send<T>('GET', path, undefined, signal);
  }

  /**
   * Sends a request; `body` (if any) is JSON-encoded. Returns the parsed JSON, or `undefined` when the server returns 204.
   * A lost connection => `ApiError('NETWORK')`; an error HTTP status => an `ApiError` carrying the backend's code; a broken 2xx body => `ApiError('INTERNAL')`.
   */
  async send<T = unknown>(method: string, path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
    const done = this.observer?.begin();
    try {
      return await this.exchange<T>(method, path, body, signal);
    } finally {
      done?.();
    }
  }

  /** One round of sending and reading the response (split from `send` so `send` always reports the end to the tracker). */
  private async exchange<T>(method: string, path: string, body: unknown, signal: AbortSignal | undefined): Promise<T> {
    const headers: Record<string, string> = { [HEADER.ACCEPT]: HEADER.JSON, ...this.extraHeaders() };
    const init: RequestInit = { method, headers };
    if (body !== undefined) {
      headers[HEADER.CONTENT_TYPE] = HEADER.JSON;
      init.body = JSON.stringify(body);
    }
    if (signal) init.signal = signal;

    let res: Response;
    try {
      res = await this.fetchImpl(path, init);
    } catch (e) {
      if (isAbort(e, signal)) throw e;
      throw new ApiError(CLIENT_ERROR.NETWORK);
    }
    if (!res.ok) throw await toApiError(res, signal);
    if (res.status === HTTP.NO_CONTENT) return undefined as T;
    try {
      return (await res.json()) as T;
    } catch (e) {
      if (isAbort(e, signal)) throw e;
      throw new ApiError(CLIENT_ERROR.INTERNAL, res.status);
    }
  }
}
