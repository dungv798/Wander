import { currentToken } from '../state/sessionToken.ts';
import { ApiClient } from './ApiClient.ts';

/** Tiêu đề xác thực của mỗi lời gọi: Bearer của máy này nếu đã có phiên; lấy mới mỗi lần nên đổi phiên có hiệu lực ngay. */
function authHeaders(): Record<string, string> {
  const token = currentToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Máy khách HTTP dùng chung của ứng dụng (một thể hiện duy nhất), gắn Bearer của máy này khi có. */
export const apiClient = new ApiClient(undefined, authHeaders);
