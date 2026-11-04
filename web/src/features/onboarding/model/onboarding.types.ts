import type { DestinationDetail, PlaceView } from '../../discover/index.ts';

/** Bốn cảnh giới thiệu: khám phá, quẹt chọn, lịch trình trên bản đồ, chia sẻ cho nhóm. */
export type SceneKind = 'discover' | 'swipe' | 'plan' | 'share';

/** Khung buổi dự kiến của một mục trong lịch mẫu (không phải giờ chính xác). */
export type SlotKey = 'morning' | 'noon' | 'afternoon' | 'lateAfternoon' | 'dusk' | 'evening';

/** Một mục của lịch mẫu theo mã địa điểm trong kho; `note` là khóa của ghi chú ngắn trong chữ hiển thị. */
export interface SampleStop {
  readonly placeId: string;
  readonly slot: SlotKey;
  readonly note: string;
}

/** Một ngày của lịch mẫu: khóa chủ đề và các mục theo thứ tự ghé thăm (`lunch` là khoảng nghỉ, không phải địa điểm). */
export interface SampleDay {
  readonly theme: string;
  readonly items: readonly (SampleStop | 'lunch')[];
}

/** Một địa điểm trên lịch đã dựng: số thứ tự trong ngày (1, 2, 3…) khớp với số ghim trên bản đồ. */
export interface TripStop {
  readonly kind: 'stop';
  readonly place: PlaceView;
  readonly slot: SlotKey;
  readonly note: string;
  readonly num: number;
  /** Tên người đề xuất nếu mục này vừa được chủ chuyến chấp nhận; null với lịch gốc. */
  readonly proposedBy: string | null;
}

/** Khoảng nghỉ trong ngày (ăn trưa): có dòng trong danh sách nhưng không có ghim. */
export interface TripBreak {
  readonly kind: 'break';
  readonly slot: SlotKey;
}

/** Mục của lịch đã dựng. */
export type TripItem = TripStop | TripBreak;

/** Một ngày của lịch đã dựng từ dữ liệu thật. */
export interface TripDay {
  readonly index: number;
  readonly theme: string;
  readonly items: readonly TripItem[];
}

/** Thuộc tính chung của mọi cảnh: dữ liệu điểm đến, giảm chuyển động, còn tự chạy không, và hai cách báo lên khung (xong cảnh / người xem chạm vào). */
export interface SceneProps {
  readonly dest: DestinationDetail;
  readonly reduced: boolean;
  readonly auto: boolean;
  /** Cảnh đã kể xong và muốn tự sang cảnh kế (khung chỉ làm khi còn tự chạy). */
  readonly onDone: () => void;
  /** Người xem chạm vào nội dung cảnh: dừng tự chuyển cảnh. */
  readonly onInteract: () => void;
  /** Báo trước cho người xem: sắp tự chuyển sau `ms` mili-giây (0 = cảnh cuối đã kể xong, nhắc nút bắt đầu). Khung vẽ dấu hiệu trên chấm tiến độ. */
  readonly onCue: (ms: number) => void;
}
