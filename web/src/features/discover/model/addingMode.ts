/** Chế độ "thêm địa điểm vào chuyến": bộ thẻ bỏ các nơi đã có trong chuyến; quẹt phải thêm thẳng vào chuyến thay vì vào "Đã chọn". Do lớp `app` nối với tính năng chuyến đi. */
export interface AddingMode {
  /** Tên chuyến hiện ở đầu bộ thẻ. */
  readonly title: string;
  /** Mã các địa điểm đã có trong chuyến (không hiện lại). */
  readonly excludeIds: readonly string[];
  /** Thêm một địa điểm vào chuyến. */
  readonly onAdd: (place: { readonly id: string; readonly category: string }) => void;
  /** Xong: quay về chuyến đi. */
  readonly onDone: () => void;
}
