import { ApiError } from '../../../shared/api/ApiError.ts';
import type { ApiClient } from '../../../shared/api/ApiClient.ts';
import { CLIENT_ERROR } from '../../../shared/api/http.const.ts';
import { PREFERENCES_API as P } from './preferencesApi.const.ts';

/** Mã trong một phần tử `{code,label}`; phần tử hỏng thì null. */
function codeOf(v: unknown): string | null {
  return typeof v === 'object' && v !== null && typeof (v as { code?: unknown }).code === 'string' ? (v as { code: string }).code : null;
}

/** Danh sách mã sở thích từ thân phản hồi `{interests:[{code,label}]}`; thiếu/sai dạng là lỗi nội bộ, phần tử hỏng bị bỏ. */
function interestCodes(body: unknown): string[] {
  const list = typeof body === 'object' && body !== null ? (body as Record<string, unknown>)[P.KEY_INTERESTS] : undefined;
  if (!Array.isArray(list)) throw new ApiError(CLIENT_ERROR.INTERNAL);
  return list.map(codeOf).filter((c): c is string => c !== null);
}

/** Đọc/ghi sở thích "Bạn mê gì?" của chủ danh tính (lưu theo danh tính để sang máy khác vẫn còn). Mọi thất bại là `ApiError` có mã của backend. */
export class HttpPreferencesGateway {
  private readonly client: ApiClient;

  /** Dùng máy khách HTTP đã cho (tiêm được khi test). */
  constructor(client: ApiClient) {
    this.client = client;
  }

  /** Mã các loại sở thích đang lưu (rỗng nếu chưa chọn). */
  async interests(): Promise<string[]> {
    return interestCodes(await this.client.get<unknown>(P.ROOT));
  }

  /** Thay TOÀN BỘ sở thích bằng `codes` (rỗng = xóa) và trả danh sách máy chủ đã chuẩn hóa (bỏ trùng, sắp xếp). */
  async saveInterests(codes: readonly string[]): Promise<string[]> {
    return interestCodes(await this.client.send<unknown>('PUT', P.INTERESTS, { [P.KEY_INTERESTS]: codes }));
  }
}
