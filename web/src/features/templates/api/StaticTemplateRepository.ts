import { ApiError } from '../../../shared/api/ApiError.ts';
import type { TemplateRepository } from './TemplateRepository.ts';

const HTTP_NOT_FOUND = 404;

/** Đường dẫn tệp lịch mẫu khi chưa có backend (cùng thư mục kho biên tập, `catalog/templates/<điểm đến>.json`). */
const RAW_URL = (id: string): string => `/data/catalog/templates/${encodeURIComponent(id)}.json`;

/**
 * Kho giả đọc tệp lịch mẫu thô (nhớ kết quả; lỗi không được nhớ để thử lại được). Yêu cầu được dùng chung giữa nhiều người gọi nên KHÔNG
 * gắn tín hiệu hủy của một người gọi vào `fetch` (hủy sẽ làm hỏng yêu cầu của người khác); người gọi tự bỏ kết quả khi đã hủy.
 * Thay bằng bản gọi API thật ở FE-10.
 */
export class StaticTemplateRepository implements TemplateRepository {
  private readonly cache = new Map<string, Promise<unknown>>();

  /** Tải tệp; 404 hoặc nội dung không phải JSON (host tĩnh trả index.html) nghĩa là "chưa có lịch mẫu". */
  templates(destId: string): Promise<unknown> {
    const hit = this.cache.get(destId);
    if (hit) return hit;
    const p = fetch(RAW_URL(destId))
      .catch(() => {
        throw new ApiError('NETWORK');
      })
      .then((res) => {
        if (res.status === HTTP_NOT_FOUND) return {};
        if (!res.ok) throw new ApiError('INTERNAL', res.status);
        return res.json().catch(() => ({}));
      })
      .catch((e: unknown) => {
        this.cache.delete(destId);
        throw e;
      });
    this.cache.set(destId, p);
    return p;
  }
}
