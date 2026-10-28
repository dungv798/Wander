/** Kiểu dữ liệu của bản đồ địa hình. */

/** Một điểm: [x, y] (điểm ảnh bản đồ hoặc màn hình tùy ngữ cảnh). */
export type Pt = readonly [number, number];

/** Siêu dữ liệu ảnh nền (meta.json). */
export interface MapMeta {
  readonly dest: string;
  readonly zoom: number;
  readonly width: number;
  readonly height: number;
  /** Góc trên trái của ảnh nền trong hệ điểm ảnh zoom 12 toàn cầu. */
  readonly origin: Pt;
  readonly credit: string;
}

/** Đường (OSM) đã chiếu sang điểm ảnh ảnh nền. */
export interface RoadVec {
  readonly k: string;
  readonly n: string;
  readonly p: readonly Pt[];
}

/** Sông (OSM). */
export interface RiverVec {
  readonly n?: string;
  readonly p: readonly Pt[];
}

/** Địa danh nền (thị trấn, thành phố). */
export interface PlaceVec {
  readonly k: string;
  readonly n: string;
  readonly p: Pt;
}

/** Vector nền (vectors.json). */
export interface MapVectors {
  readonly roads: readonly RoadVec[];
  readonly rivers: readonly RiverVec[];
  readonly places: readonly PlaceVec[];
}

/** Dữ liệu một điểm đến đã tải. */
export interface MapData {
  readonly dest: string;
  /** Địa chỉ thư mục dữ liệu, kết thúc bằng `/`. */
  readonly base: string;
  readonly meta: MapMeta;
  readonly vectors: MapVectors;
}

/** Ghim đầu vào: tọa độ địa lý + hiển thị. `kind: 'hub'` là mốc (không gộp cụm). */
export interface MapMarker {
  readonly id: string;
  readonly lat: number;
  readonly lon: number;
  readonly label?: string;
  readonly num?: number;
  readonly thumb?: string;
  readonly muted?: boolean;
  readonly kind?: 'hub';
}

/** Ghim đã chiếu: kèm tọa độ điểm ảnh bản đồ. */
export interface ProjectedMarker extends MapMarker {
  readonly p: Pt;
}

/** Camera: tâm (điểm ảnh bản đồ) và tỉ lệ (điểm ảnh màn hình / điểm ảnh bản đồ). */
export interface Camera {
  readonly cx: number;
  readonly cy: number;
  readonly s: number;
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
}

/** Tùy chọn vừa khung. */
export interface FitOptions {
  readonly padding?: number;
  readonly animate?: boolean;
  readonly maxZoomFactor?: number;
  /** Người dùng đã tự kéo/phóng và mọi điểm cần vừa khung đã nằm trong tầm nhìn thì giữ nguyên camera (đổi tab ngày không reset chỗ vừa zoom). */
  readonly keepIfVisible?: boolean;
}

/** Tùy chọn khởi tạo bản đồ. */
export interface TerrainMapOptions {
  readonly dest: string;
  readonly interactive?: boolean;
  readonly towns?: boolean;
  readonly credit?: boolean;
  readonly label: string;
  readonly onPin?: (id: string) => void;
}
