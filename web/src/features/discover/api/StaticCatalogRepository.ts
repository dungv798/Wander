import { ApiError } from '../../../shared/api/ApiError.ts';
import { normalizeSearch } from '../../../shared/lib/text.ts';
import { toDestinationDetail, toDestinationSummary } from '../model/catalogMapper.ts';
import type { RawDestination } from '../model/CatalogRaw.types.ts';
import type { DestinationDetail, DestinationSummary } from '../model/Catalog.types.ts';
import type { CatalogRepository } from './CatalogRepository.ts';

/** Đường dẫn tệp kho biên tập thô khi chưa có backend (máy chủ dev phục vụ từ backend/src/main/resources/catalog). */
const RAW_URL = (id: string): string => `/data/catalog/${encodeURIComponent(id)}.json`;

/** Mã các điểm đến đã có trong kho (backend sẽ trả danh sách thật; hiện mới có Hà Giang). */
const KNOWN_DESTINATIONS: readonly string[] = ['ha-giang'];

const HTTP_NOT_FOUND = 404;

/**
 * Kho giả: đọc tệp kho biên tập thô rồi tính view y hệt backend (khoảng cách ước tính, nhãn loại…).
 * Thay bằng `HttpCatalogRepository` khi nối backend (FE-10) mà không phải sửa giao diện.
 */
export class StaticCatalogRepository implements CatalogRepository {
  private readonly cache = new Map<string, Promise<RawDestination>>();
  private readonly mapped = new Map<string, DestinationDetail>();

  /**
   * Tải (và nhớ) một điểm đến thô; lỗi không được nhớ để lần sau thử lại được.
   * Yêu cầu được dùng chung giữa nhiều người gọi nên KHÔNG gắn tín hiệu hủy của một người gọi vào `fetch`; người gọi tự bỏ kết quả khi đã hủy.
   */
  private raw(id: string): Promise<RawDestination> {
    const hit = this.cache.get(id);
    if (hit) return hit;
    const p = fetch(RAW_URL(id))
      .catch(() => {
        throw new ApiError('NETWORK');
      })
      .then((r) => {
        if (r.status === HTTP_NOT_FOUND) throw new ApiError('NOT_FOUND', r.status);
        if (!r.ok) throw new ApiError('INTERNAL', r.status);
        return r.json().catch(() => {
          // host tĩnh có thể trả trang index.html (200) cho đường dẫn lạ: đó là "không có", không phải lỗi mạng
          throw new ApiError('NOT_FOUND', r.status);
        }) as Promise<RawDestination>;
      });
    this.cache.set(id, p);
    p.catch(() => this.cache.delete(id));
    return p;
  }

  /** Tìm trong các điểm đến đã biết theo tên hoặc vùng (không phân biệt dấu). */
  async searchDestinations(query: string, signal?: AbortSignal): Promise<DestinationSummary[]> {
    const all = await Promise.all(KNOWN_DESTINATIONS.map((id) => this.raw(id)));
    signal?.throwIfAborted();
    const q = normalizeSearch(query);
    return all.filter((d) => !q || normalizeSearch(d.name).includes(q) || normalizeSearch(d.region).includes(q)).map(toDestinationSummary);
  }

  /** Điểm đến đầy đủ theo mã. */
  async destination(id: string, signal?: AbortSignal): Promise<DestinationDetail> {
    if (!KNOWN_DESTINATIONS.includes(id)) throw new ApiError('NOT_FOUND', HTTP_NOT_FOUND);
    const raw = await this.raw(id);
    signal?.throwIfAborted();
    const hit = this.mapped.get(id);
    if (hit) return hit;
    const detail = toDestinationDetail(raw);
    this.mapped.set(id, detail);
    return detail;
  }
}
