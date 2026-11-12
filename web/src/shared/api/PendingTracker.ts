import { SLOW_REQUEST_AFTER_MS } from './slowRequest.const.ts';

/** Schedules `fn` to run after `ms` milliseconds; returns a function that cancels the timer (injectable in tests). */
export type Scheduler = (fn: () => void, ms: number) => () => void;

/** The browser's default timer. */
const browserSchedule: Scheduler = (fn, ms) => {
  const id = setTimeout(fn, ms);
  return () => clearTimeout(id);
};

/**
 * Tracks the pending API calls: `slow` is true as long as at least one call has hung past the threshold and is not done.
 * A fast call never changes the state, so a listener is only woken when `slow` really changes.
 */
export class PendingTracker {
  private readonly slowAfterMs: number;
  private readonly schedule: Scheduler;
  private readonly listeners = new Set<() => void>();
  private overdue = 0;

  /** Creates the tracker; the threshold and the timer are injectable so tests do not wait for real. */
  constructor(slowAfterMs: number = SLOW_REQUEST_AFTER_MS, schedule: Scheduler = browserSchedule) {
    this.slowAfterMs = slowAfterMs;
    this.schedule = schedule;
  }

  /** Whether any call has hung past the threshold. */
  get slow(): boolean {
    return this.overdue > 0;
  }

  /** Reports that a call started; returns a function to call when the call ends (success, error or cancel). Calling it several times counts only once. */
  begin(): () => void {
    let finished = false;
    let counted = false;
    const cancel = this.schedule(() => {
      if (finished) return;
      counted = true;
      this.overdue += 1;
      if (this.overdue === 1) this.emit();
    }, this.slowAfterMs);
    return () => {
      if (finished) return;
      finished = true;
      cancel();
      if (!counted) return;
      this.overdue -= 1;
      if (this.overdue === 0) this.emit();
    };
  }

  /** Subscribes to changes of `slow`; returns an unsubscribe function. The signature matches `useSyncExternalStore`. */
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /** Wakes every listener. */
  private emit(): void {
    for (const listener of this.listeners) listener();
  }
}

/** The app's shared tracker, attached to `apiClient`. */
export const pendingRequests = new PendingTracker();
