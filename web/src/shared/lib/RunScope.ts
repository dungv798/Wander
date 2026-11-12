/** An error that says a run was replaced or cancelled; used only to stop an old asynchronous chain, it is not a real error. */
export class RunCancelled extends Error {
  /** Creates a cancel error with a fixed message. */
  constructor() {
    super('run-cancelled');
    this.name = 'RunCancelled';
  }
}

/** One run: the wait/tween functions throw `RunCancelled` as soon as the run is no longer valid. */
export interface Run {
  /** This run is still the latest one that has not been cancelled. */
  readonly alive: () => boolean;
  /** Waits `ms` milliseconds. */
  readonly wait: (ms: number) => Promise<void>;
  /** Waits for an outside promise and then checks the run is still valid. */
  readonly until: (promise: Promise<unknown>) => Promise<void>;
  /** Runs a drawing function every frame for `ms`, the argument is the eased progress 0..1. */
  readonly tween: (ms: number, draw: (progress: number) => void) => Promise<void>;
}

const SMOOTH_A = 3;
const SMOOTH_B = 2;

/** Smooths both ends (smoothstep) of a 0..1 progress. */
export function smoothstep(t: number): number {
  const k = Math.min(1, Math.max(0, t));
  return k * k * (SMOOTH_A - SMOOTH_B * k);
}

/**
 * A 'run' manager for storytelling animation: opening a new run cancels the old run, cancelling cleans up the pending timers and frames,
 * so when the scene changes or the user touches, an old callback can no longer change the new state.
 */
export class RunScope {
  private current = 0;
  private readonly pending = new Set<() => void>();

  /** Opens a new run (cancelling the running one, if any) and returns the wait functions tied to this run. */
  begin(): Run {
    this.cancel();
    const id = this.current;
    const alive = (): boolean => id === this.current;
    /** Registers a pending wait; cancelling the run calls `abort` so the wait is rejected at once. */
    const track = (start: (settle: () => void, abort: () => void) => () => void): Promise<void> =>
      new Promise<void>((resolve, reject) => {
        let stop: () => void = () => undefined;
        const abort = (): void => {
          stop();
          this.pending.delete(abort);
          reject(new RunCancelled());
        };
        const settle = (): void => {
          this.pending.delete(abort);
          if (alive()) resolve();
          else reject(new RunCancelled());
        };
        this.pending.add(abort);
        stop = start(settle, abort);
      });
    const wait = (ms: number): Promise<void> =>
      track((settle) => {
        const timer = setTimeout(settle, ms);
        return () => clearTimeout(timer);
      });
    const until = (promise: Promise<unknown>): Promise<void> => track((settle) => {
      void promise.then(settle, settle);
      return () => undefined;
    });
    const tween = (ms: number, draw: (progress: number) => void): Promise<void> =>
      track((settle) => {
        const t0 = performance.now();
        let frame = 0;
        const step = (now: number): void => {
          const k = Math.min(1, (now - t0) / ms);
          draw(smoothstep(k));
          if (k < 1) frame = requestAnimationFrame(step);
          else settle();
        };
        frame = requestAnimationFrame(step);
        return () => cancelAnimationFrame(frame);
      });
    return { alive, wait, until, tween };
  }

  /** Cancels the current run: every pending wait is rejected with `RunCancelled`. */
  cancel(): void {
    this.current += 1;
    for (const abort of [...this.pending]) abort();
  }

  /** Runs `script` in a new run; `RunCancelled` is swallowed, any other error is rethrown. */
  async start(script: (run: Run) => Promise<void>): Promise<void> {
    try {
      await script(this.begin());
    } catch (error) {
      if (!(error instanceof RunCancelled)) throw error;
    }
  }
}
