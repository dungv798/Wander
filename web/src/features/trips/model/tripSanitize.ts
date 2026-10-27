import { LIMITS } from '../../../shared/const/limits.const.ts';
import { parseIsoDate } from '../../../shared/lib/dates.ts';
import { DateRange } from '../../../shared/domain/DateRange.ts';
import { DEFAULT_DESTINATION_ID } from '../../../shared/const/routes.const.ts';
import { ITEM_KINDS } from './trip.const.ts';
import type { BookingStatus, ItemKind, TrashEntry, Trip, TripItem, TripsState } from './trip.types.ts';

type Rec = Record<string, unknown>;

/** Số loại địa điểm tối đa lưu làm sở thích (có 6 loại trong kho). */
const MAX_INTERESTS = 12;

/** Có phải đối tượng thường. */
function isRec(v: unknown): v is Rec {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
/** Chuỗi hoặc rỗng. */
function str(v: unknown, max: number = LIMITS.MAX_ITEM_NOTE): string {
  return typeof v === 'string' ? v.slice(0, max) : '';
}
/** Chuỗi hoặc null. */
function strOrNull(v: unknown): string | null {
  return typeof v === 'string' && v ? v : null;
}
/** Số nguyên không âm trong khoảng cho phép, hoặc null. */
function intOrNull(v: unknown, max: number): number | null {
  return typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= max ? v : null;
}
/** Ngày `yyyy-mm-dd` hợp lệ, hoặc null. */
function dayOrNull(v: unknown): string | null {
  return typeof v === 'string' && parseIsoDate(v) ? v : null;
}

/** Giữ phần tử đầu tiên cho mỗi `id` (id trùng làm sửa nhầm cả hai bản và React báo trùng khóa). */
function uniqueBy<E extends { readonly id: string }>(list: readonly E[]): E[] {
  const seen = new Set<string>();
  return list.filter((e) => (seen.has(e.id) ? false : (seen.add(e.id), true)));
}

/** Làm sạch một mục; không phải mục hợp lệ (thiếu mã, loại lạ) thì trả null để bỏ đi. `days` là các ngày của chuyến: ngày ngoài khoảng → "Chưa có ngày". */
function sanitizeItem(raw: unknown, days: ReadonlySet<string>): TripItem | null {
  if (!isRec(raw) || typeof raw['id'] !== 'string' || typeof raw['type'] !== 'string' || !(raw['type'] in ITEM_KINDS)) return null;
  const type = raw['type'] as ItemKind;
  const plain = ITEM_KINDS[type].plain;
  const included = !plain && raw['included'] === true;
  return {
    id: raw['id'], placeId: strOrNull(raw['placeId']), type, title: str(raw['title'], LIMITS.MAX_ITEM_TITLE), day: ((d) => (d && days.has(d) ? d : null))(dayOrNull(raw['day'])), position: intOrNull(raw['position'], Number.MAX_SAFE_INTEGER),
    timeOfDay: typeof raw['timeOfDay'] === 'string' && /^\d{2}:\d{2}$/.test(raw['timeOfDay']) ? raw['timeOfDay'] : null, durationMin: intOrNull(raw['durationMin'], LIMITS.MAX_DURATION_MIN),
    note: str(raw['note']), costK: plain ? null : intOrNull(raw['costK'], LIMITS.MAX_MONEY_THOUSAND), included,
    referenceK: included ? intOrNull(raw['referenceK'], LIMITS.MAX_MONEY_THOUSAND) : null,
    booking: plain ? null : ((raw['booking'] === 'booked' ? 'booked' : 'pending') as BookingStatus), done: type === 'task' && raw['done'] === true,
  };
}

/** Làm sạch một mục trong thùng rác: mục hợp lệ + ngày/vị trí cũ (ngày không còn trong chuyến vẫn giữ để khôi phục báo đúng lý do). */
function sanitizeTrash(raw: unknown): TrashEntry | null {
  if (!isRec(raw) || typeof raw['id'] !== 'string') return null;
  const item = sanitizeItem(raw['item'], new Set<string>());
  if (!item) return null;
  return { id: raw['id'], item, deletedAt: typeof raw['deletedAt'] === 'number' ? raw['deletedAt'] : 0, day: dayOrNull(raw['day']), position: intOrNull(raw['position'], Number.MAX_SAFE_INTEGER) };
}

/** Làm sạch một chuyến; ngày hỏng hoặc thiếu mã thì bỏ cả chuyến (không đoán ngày). */
function sanitizeTrip(raw: unknown): Trip | null {
  if (!isRec(raw) || typeof raw['id'] !== 'string' || typeof raw['name'] !== 'string') return null;
  const start = dayOrNull(raw['startDate']);
  const end = dayOrNull(raw['endDate']);
  if (!start || !end) return null;
  try {
    DateRange.of(start, end);
  } catch {
    return null;
  }
  const strings = (v: unknown, max: number): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, max) : []);
  return {
    id: raw['id'], name: raw['name'].slice(0, LIMITS.MAX_TRIP_NAME), destinationId: typeof raw['destinationId'] === 'string' ? raw['destinationId'] : DEFAULT_DESTINATION_ID, startDate: start, endDate: end,
    datesTentative: raw['datesTentative'] === true, kind: strOrNull(raw['kind']), interests: [...new Set(strings(raw['interests'], MAX_INTERESTS))], styles: strings(raw['styles'], LIMITS.MAX_STYLES),
    pace: strOrNull(raw['pace']), budgetK: intOrNull(raw['budgetK'], LIMITS.MAX_MONEY_THOUSAND),
    items: uniqueBy((Array.isArray(raw['items']) ? raw['items'] : []).map((i) => sanitizeItem(i, new Set(DateRange.of(start, end).days()))).filter((i): i is TripItem => i !== null)),
    trash: uniqueBy((Array.isArray(raw['trash']) ? raw['trash'] : []).map(sanitizeTrash).filter((e): e is TrashEntry => e !== null)).slice(0, LIMITS.MAX_TRASH),
    createdAt: typeof raw['createdAt'] === 'number' ? raw['createdAt'] : 0,
  };
}

/** Làm sạch trạng thái chuyến đi đọc từ localStorage (không tin cậy); chuyến/mục hỏng bị bỏ, phần còn lại giữ. */
export function sanitizeTripsState(raw: unknown): TripsState | null {
  if (!isRec(raw) || !Array.isArray(raw['trips'])) return null;
  return { trips: uniqueBy(raw['trips'].map(sanitizeTrip).filter((t): t is Trip => t !== null)) };
}
