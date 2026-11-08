/** Kiểu dữ liệu bản đồ MapLibre và cổng React dùng chung. */

/** Một điểm: [x, y] (kinh độ/vĩ độ hoặc điểm ảnh màn hình tùy ngữ cảnh). */
export type Pt = readonly [number, number];

/** Ghim đầu vào: tọa độ địa lý + hiển thị. `kind: 'hub'` là mốc (không gộp cụm). */
export interface MapMarker {
  readonly id: string;
  readonly lat: number;
  readonly lon: number;
  readonly label?: string;
  readonly num?: number;
  readonly thumb?: string;
  readonly muted?: boolean;
  readonly kind?: 'hub' | 'sticker';
}

/** Ghim kèm tọa độ [kinh độ, vĩ độ] để MapLibre chiếu lên màn hình. */
export interface ProjectedMarker extends MapMarker {
  readonly p: Pt;
}

/** Kích thước khung hiển thị. */
export interface Size {
  readonly w: number;
  readonly h: number;
}

/** Phần khung bị che (ví dụ tờ kéo phía dưới) để camera căn giữa vùng nhìn thấy thật. */
export interface Insets {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

/** Chế độ hiển thị ghim: duyệt (gộp cụm) hoặc tuyến (đánh số, không gộp). */
export type MapMode = 'browse' | 'route';

/** Tuyến: các mã ghim theo thứ tự và nhãn từng đoạn (nhãn đoạn i nằm ở labels[i-1]... theo vị trí ghim đích). */
export interface MapRoute {
  readonly ids: readonly string[];
  readonly labels: readonly string[];
  readonly segments?: readonly RouteSegment[];
  /** Khóa tab ngày; mỗi khóa chỉ chạy hiệu ứng vẽ một lần trong vòng đời bản đồ. */
  readonly viewKey?: string;
}

/** Đoạn ước tính nối đúng hai ghim, không đại diện tuyến đường thực tế. */
export interface RouteSegment {
  readonly id: string;
  readonly order: number;
  readonly from: string;
  readonly to: string;
  readonly day: number;
  readonly km: number;
}

/** Tùy chọn vừa khung. */
export interface FitOptions {
  /** Các điểm địa lý bổ sung cần thấy ở cảnh toàn quốc, không biến chúng thành ghim tương tác. */
  readonly contextPoints?: readonly Pt[];
  readonly padding?: number;
  readonly animate?: boolean;
  /** Trần zoom MapLibre cho lần vừa khung này (cụm được phóng gần hơn ghim thường). */
  readonly maxZoom?: number;
  /** Giữ tương thích API TerrainMapView; MapLibre dùng maxZoom thay cho hệ số camera cũ. */
  readonly maxZoomFactor?: number;
  /** Người dùng đã tự kéo/phóng và mọi điểm cần vừa khung đã nằm trong tầm nhìn thì giữ nguyên camera (đổi tab ngày không reset chỗ vừa zoom). */
  readonly keepIfVisible?: boolean;
}

/** Tùy chọn khởi tạo bản đồ. */
export interface GeoMapOptions {
  readonly dest: string;
  readonly interactive?: boolean;
  /** Một ngón cuộn trang, hai ngón kéo/phóng bản đồ nhúng. */
  readonly cooperativeGestures?: boolean;
  readonly towns?: boolean;
  readonly credit?: boolean;
  /** Chừa dải ghi công ở đáy khi vừa khung (mặc định theo `credit`); tắt khi ghi công được đặt chỗ khác. */
  readonly creditBand?: boolean;
  readonly label: string;
  readonly onPin?: (id: string) => void;
  readonly onSegment?: (id: string) => void;
  readonly onMapDismiss?: () => void;
}
