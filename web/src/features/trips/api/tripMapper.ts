import { KIND_ORDER } from '../model/trip.const.ts';
import type { BookingStatus, ItemKind, TrashEntry, Trip, TripItem } from '../model/trip.types.ts';

/** Có phải đối tượng thường (không null, không mảng). */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Chuỗi hoặc null; kiểu khác coi như null. */
function strOrNull(v: unknown): string | null {
  return typeof v === 'string' ? v : null;
}

/** Số nguyên không âm hoặc null; số âm/lẻ/kiểu khác coi như không hợp lệ (undefined khi cần phân biệt "sai" với "trống" thì dùng `badNumber`). */
function wholeOrNull(v: unknown): number | null {
  return typeof v === 'number' && Number.isInteger(v) && v >= 0 ? v : null;
}

/** Số có mặt nhưng sai (âm, lẻ, không phải số): dữ liệu hỏng, bỏ cả mục. */
function badNumber(v: unknown): boolean {
  return v !== null && v !== undefined && wholeOrNull(v) === null;
}

/** Mã trong một phần tử `{code,label}` của API; không đúng dạng thì bỏ. */
function codeOf(v: unknown): string | null {
  return isRecord(v) && typeof v['code'] === 'string' ? v['code'] : null;
}

/** Danh sách mã từ mảng `{code,label}`; phần tử hỏng bị bỏ. */
function codes(v: unknown): string[] {
  return Array.isArray(v) ? v.map(codeOf).filter((c): c is string => c !== null) : [];
}

/** Thời điểm ISO thành mili giây từ epoch; sai dạng thì 0. */
function millis(v: unknown): number {
  const t = typeof v === 'string' ? Date.parse(v) : Number.NaN;
  return Number.isNaN(t) ? 0 : t;
}

/** Trạng thái đặt chỗ: chỉ `pending|booked`, còn lại (Nghỉ/Việc cần làm) là null. */
function bookingOf(v: unknown): BookingStatus | null {
  return v === 'pending' || v === 'booked' ? v : null;
}

/** Một mục của API (`ItemView`) thành `TripItem`; hỏng hoặc loại lạ thì null (không làm sập màn). Mục "Chưa có ngày" có `day`/`position` null. */
export function toItem(raw: unknown): TripItem | null {
  if (!isRecord(raw) || typeof raw['id'] !== 'string') return null;
  const type = KIND_ORDER.find((k) => k === raw['type']) as ItemKind | undefined;
  if (!type || badNumber(raw['costK']) || badNumber(raw['referenceK']) || badNumber(raw['durationMin'])) return null;
  const day = strOrNull(raw['day']);
  return {
    id: raw['id'],
    placeId: strOrNull(raw['placeId']),
    type,
    title: typeof raw['title'] === 'string' ? raw['title'] : '',
    day,
    position: day === null ? null : wholeOrNull(raw['position']),
    timeOfDay: strOrNull(raw['timeOfDay']),
    durationMin: wholeOrNull(raw['durationMin']),
    note: typeof raw['note'] === 'string' ? raw['note'] : '',
    costK: wholeOrNull(raw['costK']),
    included: raw['included'] === true,
    referenceK: wholeOrNull(raw['referenceK']),
    booking: bookingOf(raw['booking']),
    done: raw['done'] === true,
  };
}

/** Một mục đã xóa mềm của API thành `TrashEntry` (giữ ngày và vị trí lúc xóa); không có `deletedAt` hoặc mục hỏng thì null. */
export function toTrash(raw: unknown): TrashEntry | null {
  const item = toItem(raw);
  if (!item || !isRecord(raw) || typeof raw['deletedAt'] !== 'string') return null;
  return { id: item.id, item, deletedAt: millis(raw['deletedAt']), day: item.day, position: item.position };
}

/** Gộp các ngày và mục "Chưa có ngày" của `TripDetail` thành một danh sách phẳng (mục hỏng bị bỏ). */
export function detailItems(detail: unknown): TripItem[] {
  if (!isRecord(detail)) return [];
  const days = Array.isArray(detail['days']) ? detail['days'] : [];
  const fromDays = days.flatMap((d) => (isRecord(d) && Array.isArray(d['items']) ? d['items'] : []));
  const unscheduled = Array.isArray(detail['unscheduled']) ? detail['unscheduled'] : [];
  return [...fromDays, ...unscheduled].map(toItem).filter((i): i is TripItem => i !== null);
}

/** `TripView` của API cùng các mục và thùng rác thành `Trip`; thiếu trường bắt buộc thì null. `kind` là MÃ (nhãn tra ở `TRIP_KINDS`). */
export function toTrip(view: unknown, items: readonly TripItem[], trash: readonly TrashEntry[]): Trip | null {
  if (!isRecord(view)) return null;
  const { id, name, destination, startDate, endDate } = view;
  if (typeof id !== 'string' || typeof name !== 'string' || typeof destination !== 'string' || typeof startDate !== 'string' || typeof endDate !== 'string') return null;
  return {
    id,
    name,
    destinationId: destination,
    startDate,
    endDate,
    datesTentative: view['datesTentative'] === true,
    kind: codeOf(view['kind']),
    interests: codes(view['interests']),
    styles: codes(view['styles']),
    pace: codeOf(view['pace']),
    budgetK: wholeOrNull(view['budgetK']),
    items,
    trash,
    createdAt: millis(view['createdAt']),
  };
}
