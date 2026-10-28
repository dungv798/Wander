/** Hằng số của bản đồ địa hình (đơn vị: điểm ảnh màn hình trừ khi ghi khác). Chuyển từ docs/ux/prototype/app/map.js. */
export const MAP = {
  /** Thư mục dữ liệu bản đồ dựng sẵn (public/map/<điểm đến>/), dựng bằng docs/ux/tools/build-map.mjs. */
  DATA_PATH: '/map/',
  /** Thu nhỏ tối đa (ngoài vùng dữ liệu là màu đất phẳng). */
  MIN_SCALE: 0.1,
  /** Phóng tối đa (điểm ảnh màn hình trên điểm ảnh zoom 12). */
  MAX_SCALE: 1.8,
  FIT_PADDING: 36,
  FLY_MS: 750,
  /** Hai ghim gần hơn mức này thì gộp thành cụm (chế độ duyệt). */
  CLUSTER_PX: 34,
  LABEL_GAP: 4,
  /** Chỉ hiện tên thị trấn khi phóng đủ. */
  TOWN_MIN_SCALE: 0.16,
  /** Độ cong của đường nối (tỉ lệ độ dài). */
  ARC_CURVE: 0.18,
  ZOOM_STEP: 1.6,
  WHEEL_SENS: 0.0016,
  WHEEL_SETTLE_MS: 140,
  RAMP_TOKENS: ['--map-low', '--map-mid', '--map-high', '--map-peak'],
  /** Nửa cạnh ô chiếm chỗ của một ghim / ghim cụm (dùng khi đặt nhãn). */
  PIN_HALF: 20,
  CLUSTER_HALF: 18,
  LABEL_X: 24,
  LABEL_Y: 22,
  EDGE_PAD: 4,
  TOWN_NEAR_X: 40,
  TOWN_NEAR_Y: 14,
  /** Phóng tối đa khi vừa khung (tỉ lệ MAX_SCALE). */
  FIT_MAX_FACTOR: 0.55,
  /** Bề rộng/cao tối thiểu của vùng cần vừa khung (điểm ảnh bản đồ). */
  FIT_MIN_SPAN: 60,
  PAN_STEP: 80,
  CLUSTER_FIT_PADDING: 60,
  /** Lề (px) quanh vùng nhìn thấy khi kiểm "điểm đã nằm trong tầm nhìn" để không vừa khung lại (ghim sát mép coi như chưa thấy rõ). */
  KEEP_VISIBLE_MARGIN: 40,
  INITIAL_SCALE: 0.2,
  /** Độ trễ vẽ lần lượt từng đoạn tuyến (giây) và thời gian chấm sáng chạy một đoạn. */
  SEG_DELAY_S: 0.45,
  DOT_SECONDS_PER_SEG: 2.2,
  DOT_MIN_SECONDS: 4,
  /** Đoạn đường mang tên kiểu "G1", "S2", "X3", "Y4" hoặc chữ Hán (nhiễu của OSM) bị bỏ khỏi bản vẽ. */
  NOISE_ROAD_NAME: /^[GSXY]\d/i,
  CJK: /[㐀-鿿]/,
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
