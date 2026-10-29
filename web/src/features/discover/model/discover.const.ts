import type { CategoryCode, SlotCode } from './Catalog.types.ts';
import type { IconName } from '../../../shared/ui/icons/iconPaths.const.ts';

/** Biểu tượng của từng loại địa điểm; tên loại do kho biên tập (`categoryName`) quyết định. */
export const CATEGORY_ICON: Readonly<Record<CategoryCode, IconName>> = {
  canh: 'trees', van: 'columns', am: 'tools-kitchen-2', leo: 'mountain', luu: 'bed', cho: 'building-store',
};

/** Tên loại theo mã (khớp `PlaceCategory`/`TripInterest` của backend); dùng cho danh mục sở thích. */
export const CATEGORY_NAME: Readonly<Record<CategoryCode, string>> = {
  canh: 'Cảnh quan', van: 'Văn hóa', am: 'Ẩm thực', leo: 'Leo núi', luu: 'Lưu trú', cho: 'Chợ',
};

/** Nhãn biên tập thay điểm sao (DR-007; KHÔNG bịa số sao, G1). */
export const VERDICT_LABEL = { must: 'Nên ghé', worth: 'Đáng đi', ifconv: 'Chỉ ghé nếu tiện' } as const;

/** Kiểu hiển thị khối nhãn biên tập: mức nhấn và biểu tượng. */
export const VERDICT_STYLE = {
  must: { cls: '', icon: 'rosette-discount-check' },
  worth: { cls: 'mid', icon: 'heart' },
  ifconv: { cls: 'low', icon: 'info-circle' },
} as const;

/** Buổi trong ngày: mã, biểu tượng. Nhãn ở `COPY.slots`. */
export const SLOTS: readonly { readonly code: SlotCode; readonly icon: IconName }[] = [
  { code: 'sang', icon: 'sunrise' },
  { code: 'trua', icon: 'sun' },
  { code: 'chieu', icon: 'sunset-2' },
  { code: 'toi', icon: 'moon-stars' },
];

/** Điểm đến khác "sắp ra mắt" (chưa có dữ liệu thật; chỉ là danh sách chữ). */
export const COMING_SOON: readonly string[] = ['Sa Pa', 'Hội An', 'Đà Lạt', 'Ninh Bình', 'Phú Quốc', 'Đà Nẵng'];

/** Địa điểm dùng làm ảnh và minh họa ở màn mở đầu (id có thật trong kho biên tập). */
export const HOME_PLACES = {
  PASS: 'deo-ma-pi-leng',
  COVER: 'hoang-su-phi',
  RIVER: 'song-nho-que',
  LIVE_CARD: ['deo-ma-pi-leng', 'cot-co-lung-cu', 'song-nho-que', 'pho-co-dong-van'],
  PINS: [{ id: 'cot-co-lung-cu', cls: 'p1' }, { id: 'deo-ma-pi-leng', cls: 'p2' }],
  FAN: ['cao-nguyen-da', 'deo-ma-pi-leng', 'hoang-su-phi'],
  WALL: ['deo-ma-pi-leng', 'hoang-su-phi', 'song-nho-que', 'cot-co-lung-cu', 'pho-co-dong-van', 'cao-nguyen-da'],
  HIGHLIGHTS: ['deo-ma-pi-leng', 'hoang-su-phi', 'cot-co-lung-cu', 'cao-nguyen-da', 'dinh-vuong'],
} as const;

/** Điểm lấy nét của ảnh bìa trên khung ngắn: cắt bớt trời trống, giữ phần có nội dung. */
export const COVER_FOCAL: Readonly<Record<string, string>> = { 'hoang-su-phi': '50% 78%' };
export const DEFAULT_FOCAL = '50% 50%';

/** Cỡ tối đa của đoạn "Về nơi này" khi thu gọn (số dòng do CSS `.clamp`). */
export const ABOUT_MIN_LENGTH = 1;

/** Số ảnh lấy từ catalog cho từng khối trang chủ. */
export const HOME_PREVIEW = { HERO: 3, WALL: 6, HIGHLIGHTS: 3, LIVE: 3, RIGHT: 2 } as const;
