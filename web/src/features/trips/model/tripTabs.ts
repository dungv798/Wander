/** Giá trị phần phụ của địa chỉ chuyến đi: tổng quan, chưa xếp, chi phí; còn lại là số ngày (Lịch). */
export const TRIP_TAB = { OVERVIEW: 'ov', UNASSIGNED: 'un', COST: 'cost' } as const;

/** Bốn chế độ xem của một chuyến; chọn NGÀY chỉ có ở chế độ Lịch. */
export type TripMode = 'overview' | 'schedule' | 'unassigned' | 'cost';

/** Thứ tự chế độ trên thanh chế độ. */
export const TRIP_MODES: readonly TripMode[] = ['overview', 'schedule', 'unassigned', 'cost'];

/** Phần phụ địa chỉ hợp lệ: `ov`/`un`/`cost` hoặc số ngày 1..n; sai thì về tổng quan (địa chỉ cũ `ov` và `<n>` vẫn mở như trước). */
export function validTab(sub: string | null, dayCount: number): string {
  if (sub === TRIP_TAB.UNASSIGNED || sub === TRIP_TAB.COST || sub === TRIP_TAB.OVERVIEW) return sub;
  const n = Number(sub);
  return sub && Number.isInteger(n) && n >= 1 && n <= dayCount ? String(n) : TRIP_TAB.OVERVIEW;
}

/** Chế độ xem ứng với phần phụ địa chỉ đã được kiểm tra bằng `validTab`. */
export function modeOfTab(tab: string): TripMode {
  if (tab === TRIP_TAB.UNASSIGNED) return 'unassigned';
  if (tab === TRIP_TAB.COST) return 'cost';
  return tab === TRIP_TAB.OVERVIEW ? 'overview' : 'schedule';
}

/** Địa chỉ phụ để vào một chế độ: Lịch quay lại ngày đang xem gần nhất (mặc định ngày 1). */
export function tabOfMode(mode: TripMode, lastDay: string): string {
  if (mode === 'overview') return TRIP_TAB.OVERVIEW;
  if (mode === 'unassigned') return TRIP_TAB.UNASSIGNED;
  if (mode === 'cost') return TRIP_TAB.COST;
  return lastDay;
}
