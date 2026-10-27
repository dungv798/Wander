/**
 * Cổng đọc lịch mẫu (nguyên lý D của SOLID): giao diện không biết dữ liệu đến từ tệp giả hay API thật.
 * Trả JSON THÔ (không tin cậy); `toTemplateViews` kiểm tra và ghép với kho địa điểm.
 */
export interface TemplateRepository {
  /** Lịch mẫu của một điểm đến; chưa có thì trả đối tượng rỗng (không phải lỗi). Không nhận tín hiệu hủy vì yêu cầu được dùng chung. */
  templates(destId: string): Promise<unknown>;
}
