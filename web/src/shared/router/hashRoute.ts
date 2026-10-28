import { useSyncExternalStore } from 'react';
import { DEFAULT_DESTINATION_ID, VIEW } from '../const/routes.const.ts';
import type { ViewName } from '../const/routes.const.ts';

/**
 * Một tuyến đã phân tích: tên màn, mã tham số chính (mã điểm đến ở `dest`/`deck`, mã chuyến ở `trip`) và tham số phụ
 * (mã chuyến khi đang thêm địa điểm từ bộ thẻ; tab `ov`/số ngày ở `trip`).
 */
export interface Route {
  readonly view: ViewName;
  readonly id: string | null;
  readonly sub: string | null;
}

const VIEWS_WITH_DEST: readonly ViewName[] = [VIEW.DEST, VIEW.DECK];
const VIEWS_WITH_ID: readonly ViewName[] = [VIEW.DEST, VIEW.DECK, VIEW.TRIP, VIEW.TODAY, VIEW.EXPORT, VIEW.JOIN];
/** Màn có mã chuyến đi tùy chọn: `#/today` (chuyến đang diễn ra) hoặc `#/today/<mã>`. */
const VIEWS_OPTIONAL_ID: readonly ViewName[] = [VIEW.TODAY];
const KNOWN: readonly ViewName[] = Object.values(VIEW);
const HOME: Route = { view: VIEW.EXPLORE, id: null, sub: null };
/** Mã hợp lệ: chữ thường, số, gạch ngang (đi vào đường dẫn tải dữ liệu nên phải chặt). */
const ID_PATTERN = /^[a-z0-9-]{1,64}$/;
/** Mã liên kết mời: 256 bit base64url (43 ký tự, có chữ hoa và gạch dưới) nên có mẫu riêng. */
const INVITE_CODE_PATTERN = /^[A-Za-z0-9_-]{43}$/;

/** Phân tích `location.hash` (dạng `#/dest/ha-giang`, `#/trip/<mã>/2`) thành tuyến; địa chỉ lạ về Khám phá. */
export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('?')[0]?.split('/').filter(Boolean) ?? [];
  const view = KNOWN.find((v) => v === parts[0]);
  if (!view) return HOME;
  if (!VIEWS_WITH_ID.includes(view)) return { view, id: null, sub: null };
  const id = parts[1] ?? (VIEWS_WITH_DEST.includes(view) ? DEFAULT_DESTINATION_ID : null);
  if (!id && VIEWS_OPTIONAL_ID.includes(view)) return { view, id: null, sub: null };
  if (view === VIEW.JOIN) return id && INVITE_CODE_PATTERN.test(id) ? { view, id, sub: null } : HOME;
  if (!id || !ID_PATTERN.test(id)) return HOME;
  const sub = parts[2] ?? null;
  return { view, id, sub: sub && ID_PATTERN.test(sub) ? sub : null };
}

/** Dựng địa chỉ hash cho một màn. */
export function toHash(view: ViewName, id?: string | null, sub?: string | null): string {
  if (view === VIEW.EXPLORE) return '#/';
  const tail = [id, id ? sub : null].filter(Boolean).join('/');
  return tail ? `#/${view}/${tail}` : `#/${view}`;
}

/** Chuyển màn bằng cách đổi hash (nút Back của trình duyệt hoạt động đúng). */
export function navigate(view: ViewName, id?: string | null, sub?: string | null): void {
  const next = toHash(view, id, sub);
  if (location.hash !== next) location.hash = next;
}

/** Thay hash không thêm mục vào lịch sử (đổi tab ngày không làm đầy nút Back). */
export function replaceRoute(view: ViewName, id?: string | null, sub?: string | null): void {
  history.replaceState(null, '', toHash(view, id, sub));
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

/** Đăng ký nghe đổi hash. */
function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

/** Tuyến hiện tại; render lại khi hash đổi. */
export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => location.hash, () => '');
  return parseHash(hash);
}
