import { ApiError } from '../../../shared/api/ApiError.ts';
import type { ApiClient } from '../../../shared/api/ApiClient.ts';
import { CLIENT_ERROR } from '../../../shared/api/http.const.ts';
import type { DestinationDetail, DestinationSummary } from '../model/Catalog.types.ts';
import { CATALOG_API } from './catalogApi.const.ts';
import type { CatalogRepository } from './CatalogRepository.ts';
import { parseMoments } from '../model/moments.ts';

/** Có phải đối tượng thường (không null, không mảng). */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Tóm tắt hợp lệ tối thiểu: có mã, tên và vùng dạng chuỗi (đủ để danh sách và thẻ render mà không sập). */
function isSummary(v: unknown): v is DestinationSummary {
  return isRecord(v) && typeof v['id'] === 'string' && typeof v['name'] === 'string' && typeof v['region'] === 'string'
    && (v['lat'] === null || (typeof v['lat'] === 'number' && Number.isFinite(v['lat'])))
    && (v['lon'] === null || (typeof v['lon'] === 'number' && Number.isFinite(v['lon'])));
}

/** Điểm đến đầy đủ hợp lệ tối thiểu: mã, tên là chuỗi; địa điểm, cẩm nang, mốc tham chiếu là mảng (màn hình lặp qua chúng khi render). */
function isDetail(v: unknown): v is DestinationDetail {
  return isRecord(v) && typeof v['id'] === 'string' && typeof v['name'] === 'string'
    && Array.isArray(v['places']) && Array.isArray(v['guide']) && Array.isArray(v['references']);
}

/**
 * Kho đọc `/api/catalog/**` của backend (công khai, không cần phiên). Hợp đồng dữ liệu khớp `CatalogViews` nên trả thẳng, chỉ
 * kiểm hình dạng tối thiểu: thân sai thành `ApiError('INTERNAL')` thay vì để giá trị hỏng chảy vào giao diện rồi làm trắng màn.
 * Điểm đến được NHỚ theo mã (nhiều màn cùng cần một điểm đến); lỗi không được nhớ nên thử lại được.
 */
export class HttpCatalogRepository implements CatalogRepository {
  private readonly client: ApiClient;
  private readonly cache = new Map<string, Promise<DestinationDetail>>();

  /** Dùng máy khách HTTP đã cho (tiêm được khi test). */
  constructor(client: ApiClient) {
    this.client = client;
  }

  /** Tìm điểm đến theo tên hoặc vùng; chuỗi rỗng (hoặc toàn khoảng trắng) không gửi tham số và trả tất cả. Không nhớ vì chuỗi tìm đổi liên tục. */
  async searchDestinations(query: string, signal?: AbortSignal): Promise<DestinationSummary[]> {
    const q = query.trim();
    const path = q ? `${CATALOG_API.DESTINATIONS}?${CATALOG_API.QUERY_PARAM}=${encodeURIComponent(q)}` : CATALOG_API.DESTINATIONS;
    const body = await this.client.get<unknown>(path, signal);
    const list = isRecord(body) ? body['destinations'] : undefined;
    if (!Array.isArray(list) || !list.every(isSummary)) throw new ApiError(CLIENT_ERROR.INTERNAL);
    return list;
  }

  /**
   * Một điểm đến đầy đủ theo mã; backend trả 404 `NOT_FOUND` khi không có. Yêu cầu được dùng chung giữa nhiều người gọi nên KHÔNG
   * gắn tín hiệu hủy của một người gọi vào `fetch` (hủy sẽ làm hỏng yêu cầu của người khác); người gọi bị hủy chỉ nhận `AbortError`.
   */
  async destination(id: string, signal?: AbortSignal): Promise<DestinationDetail> {
    const detail = await this.cached(id);
    signal?.throwIfAborted();
    return detail;
  }

  /** Lấy (hoặc tạo) yêu cầu dùng chung cho một điểm đến; lỗi bị xóa khỏi bộ nhớ để lần sau thử lại. */
  private cached(id: string): Promise<DestinationDetail> {
    const hit = this.cache.get(id);
    if (hit) return hit;
    const request = this.fetchDestination(id);
    this.cache.set(id, request);
    request.catch(() => this.cache.delete(id));
    return request;
  }

  /** Gọi API một điểm đến và kiểm hình dạng. */
  private async fetchDestination(id: string): Promise<DestinationDetail> {
    const body = await this.client.get<unknown>(`${CATALOG_API.DESTINATIONS}/${encodeURIComponent(id)}`);
    const detail = isRecord(body) ? body['destination'] : undefined;
    if (!isDetail(detail)) throw new ApiError(CLIENT_ERROR.INTERNAL);
    return { ...detail, moments: parseMoments(detail.moments) };
  }
}
