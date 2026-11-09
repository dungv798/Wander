import { VIEW } from '../../../shared/const/routes.const.ts';
import type { ViewName } from '../../../shared/const/routes.const.ts';

/** Hằng số của bản đồ khung ứng dụng (một bản đồ bền sau các màn Khám phá / Điểm đến / Đã chọn / Chuyến đi). */
export const SHELL_MAP = {
  /** Các màn nằm trên bản đồ khung; màn khác (bộ thẻ, chuyến, cài đặt…) ẩn nó. */
  VISIBLE_VIEWS: [VIEW.EXPLORE, VIEW.DEST, VIEW.DECK, VIEW.PICKED, VIEW.TRIPS] as readonly ViewName[],
  /** Lề vừa khung quanh ghim (px). */
  FIT_PADDING_PX: 16,
  /** Lề vừa khung cho cảnh nhiều điểm đến/chuyến: đủ cho ảnh ghim (nửa cạnh) và nhãn tên, để Bắc/Nam không bị cắt ở điện thoại nhỏ (px). */
  OVERVIEW_PADDING_PX: 24,
  /** Trần zoom của cảnh cả nước để các điểm đến xa nhau vẫn nằm trọn khung. */
  OVERVIEW_MAX_ZOOM: 7,
  /** Lề trên của vùng nhìn thấy (chừa chỗ cho thanh logo/tìm kiếm nổi), px. */
  INSET_TOP_PX: 100,
  /** Màn rộng: bề rộng bảng bên trái che bản đồ (khớp `--shell-panel-width` + lề), px. */
  PANEL_INSET_PX: 556,
  /** Điện thoại, bảng mở: phần chiều cao khung bị bảng che. */
  SHEET_OPEN_FRACTION: 0.7,
  /** Home mobile có tờ bắt đầu ở 39%, phải vừa map trong khoảng thật sự nhìn thấy. */
  HOME_SHEET_COVER_FRACTION: 0.61,
  /** Điện thoại, bảng thu lại: chiều cao thanh tiêu đề còn che đáy, px. */
  PEEK_INSET_PX: 140,
} as const;

/** Kéo tờ nội dung trên điện thoại (thu để xem bản đồ rộng hơn, kéo lên để mở lại). */
export const SHEET_DRAG = {
  /** Kéo quá phần này của quãng đường giữa hai trạng thái thì chuyển trạng thái khi thả. */
  COMMIT_FRACTION: 0.25,
  /** Hất nhanh hơn tốc độ này (px/ms) thì chuyển trạng thái dù kéo chưa tới ngưỡng. */
  FLING_PX_PER_MS: 0.5,
  /** Di chuyển ngắn hơn mức này (px) vẫn là một lần bấm, không phải kéo. */
  TAP_SLOP_PX: 8,
  /** Chiều cao (px) của tờ khi mở nếu chưa đo được. */
  FALLBACK_OPEN_TOP_FRACTION: 0.3,
} as const;
