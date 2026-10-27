import type { DestinationDetail, DestinationSummary } from '../model/Catalog.types.ts';

/**
 * Cổng đọc kho biên tập (nguyên lý D của SOLID): giao diện chỉ biết hợp đồng này, không biết dữ liệu đến từ tệp giả hay API thật.
 * Hợp đồng khớp `/api/catalog/**` của backend (`CatalogController`).
 */
export interface CatalogRepository {
  /** Tìm điểm đến theo tên (không phân biệt dấu); chuỗi rỗng trả tất cả. */
  searchDestinations(query: string, signal?: AbortSignal): Promise<DestinationSummary[]>;
  /** Một điểm đến đầy đủ; ném `ApiError('NOT_FOUND')` nếu không có. */
  destination(id: string, signal?: AbortSignal): Promise<DestinationDetail>;
}
