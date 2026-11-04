import type { Run } from '../../../shared/lib/RunScope.ts';
import { PLAN_TIMING } from './onboarding.const.ts';
import type { TripDay } from './onboarding.types.ts';

/** Khung nhìn của cảnh bản đồ: tab (0 = tổng quan), số dòng đã hiện của ngày đang xem, dòng đang được giới thiệu (-1 = không). */
export interface PlanView {
  readonly tab: number;
  readonly rows: number;
  readonly hot: number;
}

/** Khung nhìn đầy đủ của một tab: mọi dòng đã hiện, không dòng nào nổi bật. */
export function fullView(tab: number): PlanView {
  return { tab, rows: Number.POSITIVE_INFINITY, hot: -1 };
}

/** Giới thiệu một ngày: zoom vào ngày, rồi lần lượt từng dòng (ghim 1→2→3…, danh sách nổi bật theo ghim), dừng lại một nhịp. */
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

/** Kịch bản cảnh bản đồ: tên chuyến + tổng quan → Ngày 1 → Ngày 2 (màu khác, camera di chuyển nhẹ) → zoom ra toàn chuyến. `ready` chờ bản đồ tải (hoặc sơ đồ thay thế) nhưng chỉ ngay trước khi cần zoom, để bản đồ tải song song với phần tổng quan. */
export async function playPlan(run: Run, days: readonly TripDay[], ready: Promise<void>, show: (view: PlanView) => void): Promise<void> {
  show({ tab: 0, rows: 0, hot: -1 });
  await run.wait(PLAN_TIMING.OVERVIEW_MS);
  await run.until(ready);
  for (const [i, day] of days.entries()) await playDay(run, day, i === days.length - 1, show);
  show({ tab: 0, rows: 0, hot: -1 });
}
