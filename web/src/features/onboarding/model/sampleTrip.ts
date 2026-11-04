import type { PlaceView } from '../../discover/index.ts';
import { PROPOSAL, SAMPLE_TRIP } from './onboarding.const.ts';
import type { SlotKey, TripBreak, TripDay, TripItem, TripStop } from './onboarding.types.ts';

const LUNCH_SLOT: SlotKey = 'noon';

/** Tra địa điểm theo mã trong kho của điểm đến; null nếu không có. */
export type PlaceLookup = (id: string) => PlaceView | null;

/** Đánh lại số 1, 2, 3… cho các địa điểm của một ngày (khoảng nghỉ không có số) để số ghim luôn khớp số trong danh sách. */
function renumber(items: readonly TripItem[]): TripItem[] {
  let n = 0;
  return items.map((item) => (item.kind === 'stop' ? { ...item, num: ++n } : item));
}

/** Dựng lịch mẫu từ dữ liệu thật của điểm đến; địa điểm thiếu trong kho hoặc thiếu tọa độ bị bỏ qua (không thay bằng điểm khác). */
export function buildTrip(find: PlaceLookup): TripDay[] {
  return SAMPLE_TRIP.map((day, index) => {
    const items: TripItem[] = day.items.flatMap((entry): TripItem[] => {
      if (entry === 'lunch') return [{ kind: 'break', slot: LUNCH_SLOT } satisfies TripBreak];
      const place = find(entry.placeId);
      if (!place || place.lat === null || place.lon === null) return [];
      return [{ kind: 'stop', place, slot: entry.slot, note: entry.note, num: 0, proposedBy: null } satisfies TripStop];
    });
    return { index, theme: day.theme, items: renumber(items) };
  });
}

/** Các địa điểm (có ghim) của một ngày theo thứ tự ghé thăm. */
export function dayPlaces(day: TripDay): PlaceView[] {
  return day.items.flatMap((item) => (item.kind === 'stop' ? [item.place] : []));
}

/** Địa điểm có trong lịch ở ngày nào (chỉ số ngày) hoặc -1 nếu chưa có. */
export function dayOfPlace(days: readonly TripDay[], placeId: string): number {
  return days.findIndex((d) => d.items.some((i) => i.kind === 'stop' && i.place.id === placeId));
}

/** Chủ chuyến chấp nhận đề xuất: đặt địa điểm lên đầu ngày được đề xuất và đánh lại số; không tạo bản sao nếu địa điểm đã có trong lịch. */
export function applyProposal(days: readonly TripDay[], place: PlaceView): TripDay[] {
  if (dayOfPlace(days, place.id) >= 0) return [...days];
  return days.map((day) => {
    if (day.index !== PROPOSAL.dayIndex) return day;
    const added: TripStop = { kind: 'stop', place, slot: PROPOSAL.slot, note: '', num: 0, proposedBy: PROPOSAL.by };
    return { ...day, items: renumber([added, ...day.items]) };
  });
}
