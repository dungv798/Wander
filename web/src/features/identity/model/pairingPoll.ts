import { ApiError } from '../../../shared/api/ApiError.ts';
import { UNKNOWN_CODE } from '../../../shared/api/errorMessages.const.ts';
import { IDENTITY } from './identity.const.ts';
import { PAIRING_POLL as P } from './pairingPoll.const.ts';
import type { PairingStatus } from './identity.types.ts';

/** A network error or HTTP 429 is retried silently; any other error must be reported through the existing error gate. */
export function isRetryablePairingError(error: unknown): boolean {
  return error instanceof ApiError && (error.isNetwork || error.status === P.RATE_LIMIT_STATUS);
}

/** Doubles the consecutive wait, with a ceiling; one successful response brings it back to the base rhythm. */
export function nextPairingDelay(current: number): number {
  return Math.min(current * P.BACKOFF_FACTOR, P.MAX_DELAY_MS);
}

interface PollOptions {
  readonly expiresAt: number;
  readonly readStatus: (signal: AbortSignal) => Promise<PairingStatus>;
  readonly approved: () => Promise<void>;
  readonly finish: (outcome: 'denied' | 'expired') => void;
  readonly report: (error: unknown) => void;
  readonly joinFailed: () => void;
}

type Visibility = Pick<Document, 'hidden' | 'addEventListener' | 'removeEventListener'>;

/** One poll loop owns the HTTP, the timer and the listener of exactly one screen build. */
class PairingPoll {
  private disposed = false;
  private stopped = false;
  private inFlight = false;
  private delay: number = IDENTITY.POLL_MS;
  private lastErrorCode: string | null = null;
  private nextAt = Date.now() + this.delay;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private readonly expiryTimer: ReturnType<typeof setTimeout>;
  private readonly abort = new AbortController();
  private readonly options: PollOptions;
  private readonly visibility: Visibility;

  /** The local time limit runs independently of a slow HTTP; it does not change the server's approval step. */
  constructor(options: PollOptions, visibility: Visibility) {
    this.options = options;
    this.visibility = visibility;
    this.expiryTimer = setTimeout(() => this.expire(), Math.max(0, options.expiresAt + 1 - Date.now()));
    visibility.addEventListener(P.VISIBILITY_EVENT, this.onVisibility);
    this.schedule();
  }

  /** Removes the timer and the listener and cancels the HTTP; any result that arrives late is ignored. */
  stop = (): void => {
    this.disposed = true;
    clearTimeout(this.timer);
    clearTimeout(this.expiryTimer);
    this.abort.abort();
    this.visibility.removeEventListener(P.VISIBILITY_EVENT, this.onVisibility);
  };

  /** Blocks every further ask after the final state but still lets the session receipt finish. */
  private finish(): void {
    this.stopped = true;
    clearTimeout(this.timer);
    clearTimeout(this.expiryTimer);
  }

  /** Expires even when the HTTP has not returned; does not report the cancel error created by the poll loop itself. */
  private expire(): void {
    if (this.disposed || this.stopped) return;
    this.finish();
    this.abort.abort();
    this.options.finish('expired');
  }

  /** Schedules the next ask, creating no HTTP timer while the screen is hidden. */
  private schedule(): void {
    if (this.disposed || this.stopped || this.visibility.hidden) return;
    this.timer = setTimeout(() => { void this.poll(); }, Math.max(0, this.nextAt - Date.now()));
  }

  /** When shown again it checks at once if the rhythm is due, still keeping the backoff and not stacking on an HTTP call in progress. */
  private readonly onVisibility = (): void => {
    clearTimeout(this.timer);
    if (!this.inFlight) this.schedule();
  };

  /** Each round sends only one HTTP; every error backs off with a ceiling, success resets the rhythm and the reported error chain. */
  private async poll(): Promise<void> {
    if (this.disposed || this.stopped || this.inFlight || this.visibility.hidden) return;
    if (Date.now() > this.options.expiresAt) { this.expire(); return; }
    this.inFlight = true;
    try {
      const status = await this.options.readStatus(this.abort.signal);
      if (this.disposed || this.stopped) return;
      this.delay = IDENTITY.POLL_MS;
      this.lastErrorCode = null;
      if (status === 'approved') {
        this.finish();
        await this.options.approved().catch((error: unknown) => {
          if (this.disposed) return;
          this.options.report(error);
          this.options.joinFailed();
        });
      } else if (status === 'denied' || status === 'expired') {
        this.finish();
        this.options.finish(status);
      }
    } catch (error) {
      if (this.disposed || this.stopped) return;
      this.delay = nextPairingDelay(this.delay);
      const code = error instanceof ApiError ? error.code : UNKNOWN_CODE;
      if (code !== this.lastErrorCode && !isRetryablePairingError(error)) this.options.report(error);
      this.lastErrorCode = code;
    } finally {
      this.inFlight = false;
      this.nextAt = Date.now() + this.delay;
      this.schedule();
    }
  }
}

/** Polls sequentially, sleeps when hidden; returns a cancel handle so the effect cleans up fully on removal or when the request changes. */
export function startPairingPoll(options: PollOptions, visibility: Visibility = document): () => void {
  return new PairingPoll(options, visibility).stop;
}
