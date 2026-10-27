import { STORAGE } from '../const/app.const.ts';
import { PersistentStore } from './PersistentStore.ts';

/** Bí mật phiên của MÁY NÀY (Bearer). Lưu ở localStorage theo quyết định AD-1 (giữ tới khi xét lại ở RG-6); server chỉ giữ băm. */
export interface TokenState {
  readonly token: string | null;
}

/** Độ dài tối thiểu và bảng ký tự của bí mật phiên (khớp `IdentityConstants.SESSION_TOKEN_REGEX` của backend: 43–128 ký tự base64url). */
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43,128}$/;

/** Làm sạch giá trị đã lưu: chỉ nhận chuỗi đúng dạng bí mật phiên; mọi thứ khác coi như chưa có phiên. */
export function sanitizeToken(raw: unknown): TokenState | null {
  const token = typeof raw === 'object' && raw !== null ? (raw as { token?: unknown }).token : null;
  return { token: typeof token === 'string' && TOKEN_PATTERN.test(token) ? token : null };
}

/** Kho bí mật phiên dùng chung cho cả máy khách HTTP (gắn tiêu đề) lẫn tính năng danh tính (tạo, thu hồi). */
export const sessionTokenStore = new PersistentStore<TokenState>(STORAGE.TOKEN, { token: null }, sanitizeToken);

/** Bí mật phiên hiện tại hoặc null nếu máy này chưa có phiên. */
export function currentToken(): string | null {
  return sessionTokenStore.getSnapshot().token;
}

/** Lưu bí mật phiên mới (sau khi tạo danh tính, khôi phục hoặc được ghép). */
export function setToken(token: string): void {
  sessionTokenStore.update(() => ({ token }));
}

/** Quên bí mật phiên (hết phiên hoặc chủ động rời). */
export function clearToken(): void {
  sessionTokenStore.update(() => ({ token: null }));
}
