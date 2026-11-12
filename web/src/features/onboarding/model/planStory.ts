import type { Run } from '../../../shared/lib/RunScope.ts';
import { PLAN_TIMING } from './onboarding.const.ts';
import type { TripDay } from './onboarding.types.ts';

/** The view of the map scene: the tab (0 = overview), the number of rows already shown of the day being viewed, the row being introduced (-1 = none). */
export interface PlanView {
  readonly tab: number;
  readonly rows: number;
  readonly hot: number;
}

/** The full view of a tab: every row shown, no row highlighted. */
export function fullView(tab: number): PlanView {
  return { tab, rows: Number.POSITIVE_INFINITY, hot: -1 };
}

/** Introducing a day: zoom into the day, then each row in turn (pin 1->2->3..., the list highlighted by pin), pausing a beat. */
async function playDay(run: Run, day: TripDay, last: boolean, show: (view: PlanView) => void): Promise<void> {
  const tab = day.index + 1;
  show({ tab, rows: 0, hot: -1 });
  await run.wait(PLAN_TIMING.DAY_ZOOM_MS);
  for (const [i, item] of day.items.entries()) {
    show({ tab, rows: i + 1, hot: i });
    await run.wait(item.kind === 'stop' ? PLAN_TIMING.PIN_MS : PLAN_TIMING.BREAK_MS);
  }
  show({ tab, rows: day.items.length, hot: -1 });
  await run.wait(last ? PLAN_TIMING.LAST_DAY_END_MS : PLAN_TIMING.DAY_END_MS);
}

/** The map scene script: trip name + overview -> Day 1 -> Day 2 (another color, the camera moves slightly) -> zoom out to the whole trip. `ready` waits for the map to load (or the replacement diagram) but only right before the zoom is needed, so the map loads in parallel with the overview part. */
export async function playPlan(run: Run, days: readonly TripDay[], ready: Promise<void>, show: (view: PlanView) => void): Promise<void> {
  show({ tab: 0, rows: 0, hot: -1 });
  await run.wait(PLAN_TIMING.OVERVIEW_MS);
  await run.until(ready);
  for (const [i, day] of days.entries()) await playDay(run, day, i === days.length - 1, show);
  show({ tab: 0, rows: 0, hot: -1 });
}
