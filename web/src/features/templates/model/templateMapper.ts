import type { DestinationDetail, PlaceView } from '../../discover/index.ts';
import { MAX_TEMPLATE_DAYS, MAX_TEXT, MAX_TITLE } from './templates.const.ts';
import type { TemplateDay, TemplateStatus, TemplateView } from './template.types.ts';

type Rec = Record<string, unknown>;

/** Có phải đối tượng thường. */
function isRec(v: unknown): v is Rec {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Chuỗi không rỗng đã cắt độ dài, hoặc null. */
function text(v: unknown, max: number): string | null {
  return typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null;
}

/** Ghép một ngày với kho: địa điểm không có trong kho hoặc đã xuất hiện ở ngày trước bị bỏ (mỗi địa điểm chỉ một lần trong chuyến). */
function toDay(raw: unknown, byId: ReadonlyMap<string, PlaceView>, used: Set<string>): TemplateDay {
  const rec = isRec(raw) ? raw : {};
  const ids = Array.isArray(rec['places']) ? rec['places'].filter((x): x is string => typeof x === 'string') : [];
  const places = ids.flatMap((id) => {
    const p = byId.get(id);
    if (!p || used.has(id)) return [];
    used.add(id);
    return [p];
  });
  return { places, note: text(rec['note'], MAX_TEXT) };
}

/** Ghép một lịch mẫu thô với kho; trả null nếu thiếu mã/tên hoặc không còn địa điểm nào hợp lệ. */
function toTemplate(raw: unknown, byId: ReadonlyMap<string, PlaceView>): TemplateView | null {
  if (!isRec(raw)) return null;
  const id = text(raw['id'], MAX_TITLE);
  const title = text(raw['title'], MAX_TITLE);
  if (!id || !title || !Array.isArray(raw['days'])) return null;
  const used = new Set<string>();
  const days = raw['days'].slice(0, MAX_TEMPLATE_DAYS).map((d) => toDay(d, byId, used));
  if (!used.size) return null;
  const status: TemplateStatus = raw['status'] === 'approved' ? 'approved' : 'draft';
  return { id, title, summary: text(raw['summary'], MAX_TEXT) ?? '', status, days, placeCount: used.size };
}

/**
 * Biến JSON lịch mẫu thô (không tin cậy) thành view gắn với điểm đến. Lịch mẫu không hợp lệ hoặc trỏ tới địa điểm đã gỡ bị bỏ;
 * trạng thái lạ coi là bản nháp (an toàn: chưa được duyệt thì luôn có nhãn).
 */
export function toTemplateViews(raw: unknown, dest: DestinationDetail): TemplateView[] {
  if (!isRec(raw) || !Array.isArray(raw['templates'])) return [];
  const byId = new Map(dest.places.map((p) => [p.id, p]));
  const seen = new Set<string>();
  return raw['templates'].flatMap((t) => {
    const view = toTemplate(t, byId);
    if (!view || seen.has(view.id)) return [];
    seen.add(view.id);
    return [view];
  });
}
