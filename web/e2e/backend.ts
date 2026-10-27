// Trợ giúp e2e nói chuyện thẳng với backend thật (cổng 8787 theo proxy của Vite): đóng vai MỘT THIẾT BỊ KHÁC của chủ danh tính.
import { randomBytes } from 'node:crypto';
import type { Page } from 'playwright-core';

/** Địa chỉ backend thật; chạy bằng `tools\dev.ps1 run` hoặc jar với `PORT=8787`. */
export const BACKEND = process.env['WANDER_BASE_URL'] ?? 'http://127.0.0.1:8787';
/** Khóa localStorage giữ bí mật phiên của máy này (khớp `STORAGE.TOKEN` của ứng dụng). */
export const TOKEN_KEY = 'wander.web.token.v1';

/** Kết quả một lời gọi API: mã HTTP và thân JSON (null nếu không có thân). */
export interface ApiResult {
  readonly status: number;
  readonly body: Record<string, unknown> | null;
}

/** Gọi API backend với bí mật phiên tùy chọn. */
export async function api(method: string, path: string, token: string | null, body?: unknown): Promise<ApiResult> {
  const res = await fetch(`${BACKEND}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, body: text ? (JSON.parse(text) as Record<string, unknown>) : null };
}

/** Lấy một trường chuỗi/số của thân phản hồi; ném lỗi rõ ràng nếu thiếu (e2e phải đỏ ngay, không nuốt lỗi). */
export function field<T extends string | number>(r: ApiResult, name: string): T {
  const v = r.body?.[name];
  if (v === undefined || v === null) throw new Error(`Phản hồi ${r.status} thiếu trường ${name}: ${JSON.stringify(r.body)}`);
  return v as T;
}

/** Bí mật phiên mới 43 ký tự base64url (như máy thật tự sinh). */
export function newToken(): string {
  return randomBytes(32).toString('base64url');
}

/** Danh tính vừa tạo qua API: bí mật phiên của "thiết bị đầu" và (nếu có) mã khôi phục dạng hiển thị. */
export interface Owner {
  readonly token: string;
  readonly code: string | null;
}

/** Tạo danh tính ẩn danh; `withCode` thì phát và xác nhận luôn một mã khôi phục (hai pha, đúng như giao diện). */
export async function createOwner(opts: { withCode?: boolean; deviceName?: string } = {}): Promise<Owner> {
  const created = await api('POST', '/api/identity', null, { skipRecoveryCode: true, deviceName: opts.deviceName ?? 'Điện thoại' });
  const token = field<string>(created, 'token');
  if (!opts.withCode) return { token, code: null };
  const begun = await api('POST', '/api/recovery-code/begin', token, {});
  const code = field<string>(begun, 'replacementCode');
  const done = await api('POST', '/api/recovery-code/confirm', token, { pendingId: field<string>(begun, 'pendingId'), replacementCode: code });
  if (done.status >= 300) throw new Error(`Xác nhận mã thất bại: ${done.status}`);
  return { token, code };
}

/** Thêm một thiết bị tin cậy cho chủ (ghép đúng quy trình: máy mới xin ghép, máy chủ duyệt bằng đúng số). Trả bí mật phiên của thiết bị mới. */
export async function addDevice(ownerToken: string, deviceName: string): Promise<string> {
  const token = newToken();
  const link = await api('POST', '/api/device-links', null, { sessionToken: token, deviceName });
  const pairingCode = field<string>(link, 'pairingCode');
  const approved = await api('POST', '/api/device-links/approve', ownerToken, { pairingCode, number: field<number>(link, 'matchNumber') });
  if (approved.status >= 300) throw new Error(`Duyệt ghép thất bại: ${approved.status} ${JSON.stringify(approved.body)}`);
  return token;
}

/** Mở trang bằng danh tính có sẵn: ghi bí mật phiên vào localStorage rồi tải lại (kho đọc lúc khởi tạo). */
export async function loginAs(page: Page, token: string): Promise<void> {
  await page.evaluate(([key, value]) => localStorage.setItem(key as string, JSON.stringify({ token: value })), [TOKEN_KEY, token] as const);
  await page.reload();
}

/** Danh sách thiết bị của chủ theo máy chủ (để khẳng định kết quả thật, không chỉ nhìn giao diện). */
export async function devicesOf(token: string): Promise<{ id: string; name: string; current: boolean }[]> {
  const r = await api('GET', '/api/sessions', token);
  const list = (r.body?.['sessions'] ?? r.body?.['devices'] ?? []) as { id: string; deviceName?: string; name?: string; current?: boolean }[];
  return list.map((d) => ({ id: d.id, name: d.deviceName ?? d.name ?? '', current: d.current === true }));
}
