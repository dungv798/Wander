/** Hằng số bản đồ MapLibre và lớp ghim native (đơn vị px trừ khi ghi khác). */
export const MAP = {
  THUMB_PX: 96,
  PIN_PX: 44,
  PIN_RADIUS: 22,
  HUB_RADIUS: 13,
  PIN_BORDER: 3,
  SELECT_BORDER: 6,
  MUTED_OPACITY: 0.8,
  MUTED_SCALE: 0.62,
  LABEL_SIZE: 12.5,
  NUMBER_SIZE: 17,
  LABEL_OFFSET: 2,
  TEXT_HALO: 2,
  CIRCLE_RADIANS: Math.PI * 2,
  RGB_MAX: 255,
  COORD_DIGITS: 1,
  PIN_SOURCES: ['wander-pins-clustered', 'wander-pins-plain'],
  PIN_LAYER_PREFIX: 'wander-pins-',
  CLUSTER_LAYER: 'wander-clusters',
  CLUSTER_TEXT_LAYER: 'wander-clusters-count',
  FONT: ['Noto Sans Regular'],
  EMPTY_IMAGE: 'wander-empty-pin',
  IMAGE_CHANNELS: 4,
  FIT_PADDING: 36,
  FLY_MS: 750,
  /** Hai ghim gần hơn mức này thì gộp thành cụm (chế độ duyệt). */
  CLUSTER_PX: 34,
  LABEL_GAP: 4,
  /** Độ cong của đường nối (tỉ lệ độ dài). */
  ARC_CURVE: 0.18,
  /** Nửa cạnh ô chiếm chỗ của một ghim / ghim cụm (dùng khi đặt nhãn). */
  PIN_HALF: 20,
  CLUSTER_HALF: 18,
  LABEL_X: 24,
  LABEL_Y: 22,
  EDGE_PAD: 4,
  CLUSTER_FIT_PADDING: 60,
  /** Lề (px) quanh vùng nhìn thấy khi kiểm "điểm đã nằm trong tầm nhìn" để không vừa khung lại (ghim sát mép coi như chưa thấy rõ). */
  KEEP_VISIBLE_MARGIN: 40,
  /** Kiểu nền vector OpenFreeMap (ADR-015); công cộng, không khóa API, không SLA. */
  STYLE_URL: 'https://tiles.openfreemap.org/styles/liberty',
  /** Ô độ cao Terrarium của AWS Open Data cho lớp bóng núi. */
  DEM_TILES: 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
  DEM_MAX_ZOOM: 12,
  DEM_TILE_SIZE: 256,
  DEM_ATTRIBUTION: 'Độ cao: Mapzen, AWS Open Data',
  /** Khung nhìn cả nước [tây, nam, đông, bắc] theo độ (bản đồ Việt Nam khi chưa có ghim). */
  VIETNAM_BOUNDS: [102.1, 8.4, 109.6, 23.4],
  /** Giới hạn zoom của MapLibre: xa nhất thấy cả nước, gần nhất thấy phố. */
  GL_MIN_ZOOM: 4,
  GL_MAX_ZOOM: 17,
  /** Phóng tối đa khi vừa khung ghim (một ghim đơn lẻ không bị phóng sát). */
  GL_FIT_MAX_ZOOM: 14,
  /** Số chữ số thập phân của điểm kiểm mức zoom. */
  ZOOM_DIGITS: 2,
  /** Bề rộng nét tuyến và viền sáng quanh nó (px). */
  ROUTE_WIDTH: 4.5,
  ROUTE_HALO_WIDTH: 9,
  ROUTE_HALO_OPACITY: 0.9,
  /** Màu lớp bóng núi (nhạt, ấm; cùng hệ màu bản đồ cũ) và độ đậm. */
  HILL_SHADOW: '#8a6f55',
  HILL_HIGHLIGHT: '#fffaf0',
  HILL_ACCENT: '#c9b08f',
  HILL_EXAGGERATION: 0.5,
  /** Chiều cao (px) dải ghi công đè đáy bản đồ: vùng vừa khung chừa thêm chừng này ở đáy. */
  CREDIT_BAND: 44,
  /** Tên nguồn/lớp do Wander thêm vào kiểu bản đồ. */
  DEM_SOURCE_ID: 'wander-dem',
  HILL_LAYER_ID: 'wander-hillshade',
  ROUTE_SOURCE_ID: 'wander-route',
  ROUTE_HALO_LAYER_ID: 'wander-route-halo',
  ROUTE_LINE_LAYER_ID: 'wander-route-line',
} as const;
