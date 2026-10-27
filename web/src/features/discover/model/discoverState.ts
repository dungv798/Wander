import type { CategoryCode } from './Catalog.types.ts';

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
}

/** Mã khối cẩm nang mở mặc định khi mới vào (Mùa nên đi). */
export const DEFAULT_GUIDE_OPEN = 'mua';

/** Trạng thái ban đầu của người mới. */
export const INITIAL_DISCOVER_STATE: DiscoverState = {
  decisions: {}, history: [], photo: {}, cat: 'all', guide: DEFAULT_GUIDE_OPEN, pack: {}, onboarded: false,
};

/** Ghi quyết định cho một thẻ; thẻ nào cũng về ảnh đầu và vào lịch sử để Hoàn tác. */
export function decide(s: DiscoverState, placeId: string, decision: Decision): DiscoverState {
  return {
    ...s,
    decisions: { ...s.decisions, [placeId]: decision },
    history: [...s.history, placeId],
    photo: { ...s.photo, [placeId]: 0 },
  };
}

/** Hoàn tác thẻ quyết định gần nhất (không có gì thì giữ nguyên). */
export function undoLast(s: DiscoverState): DiscoverState {
  const id = s.history[s.history.length - 1];
  if (id === undefined) return s;
  const { [id]: _removed, ...rest } = s.decisions;
  // đưa bộ lọc về "Tất cả": thẻ vừa hoàn tác có thể thuộc loại khác loại đang lọc và sẽ không hiện
  return { ...s, decisions: rest, history: s.history.slice(0, -1), cat: 'all' };
}

/** Bỏ chọn một nơi đã thích (khỏi "Đã chọn" và khỏi lịch sử Hoàn tác). */
export function unpick(s: DiscoverState, placeId: string): DiscoverState {
  const { [placeId]: _removed, ...rest } = s.decisions;
  return { ...s, decisions: rest, history: s.history.filter((h) => h !== placeId) };
}

/** Gỡ nhiều nơi khỏi "Đã chọn" cùng lúc (sau khi đã lưu vào chuyến đi) và khỏi lịch sử Hoàn tác. */
export function clearPicked(s: DiscoverState, ids: readonly string[]): DiscoverState {
  const drop = new Set(ids);
  return { ...s, decisions: Object.fromEntries(Object.entries(s.decisions).filter(([id]) => !drop.has(id))), history: s.history.filter((h) => !drop.has(h)) };
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

/** Các thẻ còn lại để quẹt: chưa quyết và đúng bộ lọc loại. */
export function remainingIds<P extends { id: string; category: CategoryCode }>(s: DiscoverState, places: readonly P[]): P[] {
  return places.filter((p) => (s.cat === 'all' || p.category === s.cat) && !s.decisions[p.id]);
}

/** Các nơi đã chọn (thích), theo thứ tự của kho biên tập. */
export function pickedOf<P extends { id: string }>(s: DiscoverState, places: readonly P[]): P[] {
  return places.filter((p) => s.decisions[p.id] === 'like');
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
  };
}
