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
  LABEL_MAX_WIDTH: 8,
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
  FIT_PADDING: 24,
  FIT_LABEL_SPACE: 32,
  FIT_LABEL_SIDE: 56,
  FIT_SMALL_COUNT: 2,
  FIT_NEAR_KM: 0.25,
  FIT_LOCAL_KM: 2,
  FIT_CITY_KM: 8,
  FIT_NEAR_ZOOM: 17,
  FIT_LOCAL_ZOOM: 16,
  FIT_CITY_ZOOM: 15,
  FIT_REGION_ZOOM: 14,
  FLY_MS: 750,
  /** Quá thời gian này mà bản đồ chưa sẵn sàng thì báo "chưa mở được" kèm lối thay thế (mạng chậm/chặn, không có WebGL). */
  LOAD_TIMEOUT_MS: 15000,
  /** Mức thu phóng của liên kết bản đồ ngoài. */
  EXTERNAL_ZOOM: 13,
  /** Tâm và mức thu phóng cho liên kết cả nước khi chưa có ghim. */
  EXTERNAL_COUNTRY: '6/16.2/106.0',
  /** Hai ghim gần hơn mức này thì gộp thành cụm (chế độ duyệt). */
  CLUSTER_PX: 34,
  CLUSTER_BADGE_RADIUS: 10,
  CLUSTER_BADGE_OFFSET: 17,
  CLUSTER_BADGE_TEXT: 10,
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
  /** Khung nhìn cả nước [tây, nam, đông, bắc] theo độ (bản đồ Việt Nam khi chưa có ghim). */
  VIETNAM_BOUNDS: [102.1, 8.4, 115.5, 23.4],
  /** Giới hạn zoom của MapLibre: xa nhất thấy cả nước, gần nhất thấy phố. */
  GL_MIN_ZOOM: 3.4,
  GL_MAX_ZOOM: 17,
  /** Trần zoom ghim đơn; cặp ghim còn điều chỉnh theo khoảng cách trong geoMapPolicy. */
  GL_FIT_MAX_ZOOM: 16,
  /** Số chữ số thập phân của điểm kiểm mức zoom. */
  ZOOM_DIGITS: 2,
  GESTURE_LOCALE: {
    'CooperativeGesturesHandler.WindowsHelpText': 'Giữ Ctrl và cuộn để thu phóng bản đồ',
    'CooperativeGesturesHandler.MacHelpText': 'Giữ ⌘ và cuộn để thu phóng bản đồ',
    'CooperativeGesturesHandler.MobileHelpText': 'Dùng hai ngón để di chuyển bản đồ',
  },
  /** Bề rộng nét tuyến và viền sáng quanh nó (px). */
  ROUTE_WIDTH: 4.5,
  ROUTE_HALO_WIDTH: 9,
  ROUTE_HALO_OPACITY: 0.9,
  /** Nền phẳng theo PO 29/10; màu pha từ token hiện có, không thêm bảng màu riêng. */
  BASE_TOKENS: { water: '--map-water', land: '--map-land', park: '--map-low', road: '--map-road', mainRoad: '--map-main-road', casing: '--map-road-casing', label: '--map-label', halo: '--surface', boundary: '--map-boundary' },
  LAND_TINT: 1,
  PARK_TINT: 1,
  CASING_TINT: 1,
  BOUNDARY_TINT: 1,
  BASE_LABEL_HALO: 1.4,
  MINOR_ROAD_ZOOM: 11,
  SMALL_LABEL_ZOOM: 13,
  DETAIL_FADE_ZOOMS: 1,
  /** Chiều cao (px) dải ghi công đè đáy bản đồ: vùng vừa khung chừa thêm chừng này ở đáy. */
  CREDIT_BAND: 44,
  /** Tên nguồn/lớp do Wander thêm vào kiểu bản đồ. */
  ROUTE_SOURCE_ID: 'wander-route',
  ROUTE_HALO_LAYER_ID: 'wander-route-halo',
  ROUTE_LINE_LAYER_ID: 'wander-route-line',
} as const;
