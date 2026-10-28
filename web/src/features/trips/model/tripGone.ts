import { ApiError } from '../../../shared/api/ApiError.ts';
import { HTTP } from '../../../shared/api/http.const.ts';

/**
 * Lỗi khi đọc lại một chuyến có nghĩa là mình không còn trong chuyến (bị Organizer gỡ, hoặc chuyến đã xóa)? Chỉ 404 từ máy chủ mới tính;
 * rớt mạng, hết phiên hay lỗi máy chủ thì KHÔNG (không được đá người dùng ra khỏi chuyến chỉ vì mất mạng).
 */
export function isTripGone(error: unknown): boolean {
  return error instanceof ApiError && error.status === HTTP.NOT_FOUND;
}
