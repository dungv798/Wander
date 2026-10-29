import { VIEW } from '../const/routes.const.ts';
import type { ViewName } from '../const/routes.const.ts';

const HISTORY_KEY = 'wanderRouteDepth';
const TRIP_PARENTS: readonly ViewName[] = [VIEW.TRIP, VIEW.TODAY];

/** Chỉ quay lui trong lịch sử Wander có dấu; liên kết mở trực tiếp luôn có lối thoát nội bộ. */
export function routeDepth(state: unknown): number {
  if (!state || typeof state !== 'object' || !(HISTORY_KEY in state)) return 0;
  const value = state[HISTORY_KEY];
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : 0;
}

/** Giữ state của trình duyệt khi gắn độ sâu, không dùng history.length vì có thể chứa trang ngoài. */
export function withRouteDepth(state: unknown, depth: number): Record<string, unknown> {
  return { ...(state && typeof state === 'object' ? state : {}), [HISTORY_KEY]: depth };
}

/** Màn con mở thẳng dùng màn cha phù hợp; Hôm nay không mã quay về danh sách chuyến. */
export function parentRoute(view: ViewName, id: string | null): { view: ViewName; id?: string } {
  if ((view === VIEW.TODAY || view === VIEW.EXPORT) && id) return { view: VIEW.TRIP, id };
  if (TRIP_PARENTS.includes(view)) return { view: VIEW.TRIPS };
  return { view: VIEW.EXPLORE };
}
