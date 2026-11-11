import type { CategoryCode } from './Catalog.types.ts';
import { matchesDiscoveryFilter } from './discoveryFilters.ts';

/** Quyết định của người dùng với một thẻ: thích hoặc bỏ qua. */
export type Decision = 'like' | 'skip';

/** Bộ lọc loại ở màn quẹt: một loại hoặc tất cả. */
export type CategoryFilter = 'all' | CategoryCode;

/** Trạng thái khám phá lưu TRÊN MÁY (chưa có danh tính, chưa lên máy chủ; docs/ux/data-needs.md "Đã chọn chỉ nằm ở thiết bị"). */
export interface DiscoverState {
  /** placeId → thích/bỏ qua. */
  readonly decisions: Readonly<Record<string, Decision>>;
  /** Thứ tự các thẻ đã quyết, để Hoàn tác thẻ cuối. */
  readonly history: readonly string[];
  /** placeId → chỉ số ảnh đang xem trên thẻ. */
  readonly photo: Readonly<Record<string, number>>;
  readonly cat: CategoryFilter;
  /** Khối cẩm nang đang mở ('' = đóng hết). */
  readonly guide: string;
  /** Mục "Chuẩn bị mang gì" đã đánh dấu (khóa = chỉ số mục). */
  readonly pack: Readonly<Record<string, boolean>>;
  readonly onboarded: boolean;
  /** placeId → true: nơi đã thích và đã được lưu vào một chuyến đi (B-06, DR-037). Vẫn là quyết định "thích" nhưng không còn tính vào "chờ lưu". */
  readonly saved: Readonly<Record<string, boolean>>;
}

/** Mã khối cẩm nang mở mặc định khi mới vào (Mùa nên đi). */
export const DEFAULT_GUIDE_OPEN = 'mua';

/** Trạng thái ban đầu của người mới. */
export const INITIAL_DISCOVER_STATE: DiscoverState = {
  decisions: {}, history: [], photo: {}, cat: 'all', guide: DEFAULT_GUIDE_OPEN, pack: {}, onboarded: false, saved: {},
};

/** Bản sao của `saved` không có `placeId` (gỡ dấu "đã vào chuyến"). */
function withoutSaved(saved: DiscoverState['saved'], placeId: string): DiscoverState['saved'] {
  const { [placeId]: _removed, ...rest } = saved;
  return rest;
}

/** Ghi quyết định cho một thẻ; thẻ nào cũng về ảnh đầu và vào lịch sử để Hoàn tác. Quyết định mới xóa dấu "đã vào chuyến" cũ. */
export function decide(s: DiscoverState, placeId: string, decision: Decision): DiscoverState {
  return {
    ...s,
    decisions: { ...s.decisions, [placeId]: decision },
    history: [...s.history, placeId],
    photo: { ...s.photo, [placeId]: 0 },
    saved: withoutSaved(s.saved, placeId),
  };
}

/** Đánh dấu các nơi ĐÃ THÍCH là đã vào chuyến đi; bỏ qua mã không phải nơi đã thích. Quyết định "thích" được giữ nguyên. */
export function markSaved(s: DiscoverState, ids: readonly string[]): DiscoverState {
  const liked = ids.filter((id) => s.decisions[id] === 'like');
  return liked.length ? { ...s, saved: { ...s.saved, ...Object.fromEntries(liked.map((id) => [id, true])) } } : s;
}

/** Hoàn tác thẻ quyết định gần nhất (không có gì thì giữ nguyên). */
export function undoLast(s: DiscoverState): DiscoverState {
  const id = s.history[s.history.length - 1];
  if (id === undefined) return s;
  const { [id]: _removed, ...rest } = s.decisions;
  // đưa bộ lọc về "Tất cả": thẻ vừa hoàn tác có thể thuộc loại khác loại đang lọc và sẽ không hiện
  return { ...s, decisions: rest, history: s.history.slice(0, -1), cat: 'all', saved: withoutSaved(s.saved, id) };
}

/** Bỏ chọn một nơi đã thích (khỏi "Đã chọn", khỏi lịch sử Hoàn tác và gỡ dấu "đã vào chuyến"). */
export function unpick(s: DiscoverState, placeId: string): DiscoverState {
  const { [placeId]: _removed, ...rest } = s.decisions;
  return { ...s, decisions: rest, history: s.history.filter((h) => h !== placeId), saved: withoutSaved(s.saved, placeId) };
}

/** Gỡ nhiều nơi khỏi "Đã chọn" cùng lúc, khỏi lịch sử Hoàn tác và khỏi dấu "đã vào chuyến". */
export function clearPicked(s: DiscoverState, ids: readonly string[]): DiscoverState {
  const drop = new Set(ids);
  return {
    ...s,
    decisions: Object.fromEntries(Object.entries(s.decisions).filter(([id]) => !drop.has(id))),
    history: s.history.filter((h) => !drop.has(h)),
    saved: Object.fromEntries(Object.entries(s.saved).filter(([id]) => !drop.has(id))),
  };
}

/** Cho xem lại mọi thẻ đã bỏ qua (giữ nguyên các nơi đã chọn) và xóa lịch sử Hoàn tác. */
export function restartSkipped(s: DiscoverState): DiscoverState {
  const kept = Object.fromEntries(Object.entries(s.decisions).filter(([, d]) => d === 'like'));
  return { ...s, decisions: kept, history: [] };
}

/** Đặt chỉ số ảnh đang xem của một thẻ. */
export function setPhotoIndex(s: DiscoverState, placeId: string, index: number): DiscoverState {
  return { ...s, photo: { ...s.photo, [placeId]: index } };
}

/** Đặt bộ lọc loại. */
export function setCategory(s: DiscoverState, cat: CategoryFilter): DiscoverState {
  return { ...s, cat };
}

/** Mở/đóng một khối cẩm nang (bấm khối đang mở thì đóng). */
export function toggleGuide(s: DiscoverState, id: string): DiscoverState {
  return { ...s, guide: s.guide === id ? '' : id };
}

/** Đánh dấu/bỏ đánh dấu một mục "Chuẩn bị mang gì". */
export function togglePack(s: DiscoverState, key: string): DiscoverState {
  return { ...s, pack: { ...s.pack, [key]: !s.pack[key] } };
}

/** Các thẻ còn lại để quẹt: chưa quyết và đúng bộ lọc loại; nơi có ảnh thật đứng trước nơi chưa có ảnh (giữ thứ tự biên tập trong từng nhóm). */
export function remainingIds<P extends { id: string; category: CategoryCode; photos?: readonly unknown[] }>(s: DiscoverState, places: readonly P[]): P[] {
  const left = places.filter((p) => matchesDiscoveryFilter(p, s.cat) && !s.decisions[p.id]);
  const hasPhoto = (p: P): boolean => (p.photos?.length ?? 1) > 0;
  return [...left.filter(hasPhoto), ...left.filter((p) => !hasPhoto(p))];
}

/** Các nơi đã chọn (thích) và CHƯA vào chuyến nào, theo thứ tự của kho biên tập. Dùng cho số đếm, nút "+" và "Lưu N địa điểm". */
export function pickedOf<P extends { id: string }>(s: DiscoverState, places: readonly P[]): P[] {
  return places.filter((p) => s.decisions[p.id] === 'like' && !s.saved[p.id]);
}

/** Số nơi đã thích và chưa vào chuyến nào, tính trên mọi điểm đến (không cần kho biên tập). */
export function pendingPickCount(s: DiscoverState): number {
  return Object.entries(s.decisions).filter(([id, d]) => d === 'like' && !s.saved[id]).length;
}

/** Các nơi đã chọn và ĐÃ vào một chuyến đi, theo thứ tự của kho biên tập (hiện ở "Đã chọn" kèm nhãn). */
export function savedPicksOf<P extends { id: string }>(s: DiscoverState, places: readonly P[]): P[] {
  return places.filter((p) => s.decisions[p.id] === 'like' && s.saved[p.id] === true);
}

const CATEGORY_CODES: readonly string[] = ['all', 'canh', 'van', 'am', 'leo', 'luu', 'cho'];

/** Có phải đối tượng thường (không phải null, mảng). */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Giữ lại các cặp khóa→giá trị mà giá trị thỏa `ok`; bỏ cặp hỏng thay vì bỏ cả đối tượng. */
function pickRecord<V>(raw: unknown, ok: (v: unknown) => v is V): Record<string, V> {
  return isRecord(raw) ? (Object.fromEntries(Object.entries(raw).filter(([, v]) => ok(v))) as Record<string, V>) : {};
}

/**
 * Làm sạch trạng thái khám phá đọc từ localStorage (không tin cậy): đúng kiểu từng trường, giá trị thuộc tập cho phép;
 * trường hỏng về mặc định. Không phải đối tượng (null, mảng, chuỗi) thì trả null để dùng trạng thái ban đầu.
 */
export function sanitizeDiscoverState(raw: unknown): DiscoverState | null {
  if (!isRecord(raw)) return null;
  const base = INITIAL_DISCOVER_STATE;
  return {
    decisions: pickRecord(raw['decisions'], (v): v is Decision => v === 'like' || v === 'skip'),
    history: Array.isArray(raw['history']) ? raw['history'].filter((h): h is string => typeof h === 'string') : base.history,
    photo: pickRecord(raw['photo'], (v): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0),
    cat: typeof raw['cat'] === 'string' && CATEGORY_CODES.includes(raw['cat']) ? (raw['cat'] as CategoryFilter) : base.cat,
    guide: typeof raw['guide'] === 'string' ? raw['guide'] : base.guide,
    pack: pickRecord(raw['pack'], (v): v is boolean => typeof v === 'boolean'),
    onboarded: raw['onboarded'] === true,
    saved: pickRecord(raw['saved'], (v): v is true => v === true),
  };
}
