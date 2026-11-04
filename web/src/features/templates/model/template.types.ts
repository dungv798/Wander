import type { PlaceView } from '../../discover/index.ts';

/** Trạng thái duyệt nội dung: `draft` = bản nháp chờ PO duyệt (DR-018 N-2), `approved` = đã duyệt. */
export type TemplateStatus = 'draft' | 'approved' | 'reference';

/** Một ngày của lịch mẫu: các địa điểm (theo thứ tự đi) và ghi chú biên tập tùy chọn. */
export interface TemplateDay {
  readonly places: readonly PlaceView[];
  readonly note: string | null;
}

/** Một lịch mẫu đã ghép với kho địa điểm: chỉ gồm địa điểm CÓ THẬT trong kho, không giờ/giá/đánh giá. */
export interface TemplateView {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly status: TemplateStatus;
  readonly days: readonly TemplateDay[];
  /** Tổng số địa điểm khác nhau. */
  readonly placeCount: number;
}
