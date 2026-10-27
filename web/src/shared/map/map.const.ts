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
  INITIAL_SCALE: 0.2,
  /** Độ trễ vẽ lần lượt từng đoạn tuyến (giây) và thời gian chấm sáng chạy một đoạn. */
  SEG_DELAY_S: 0.45,
  DOT_SECONDS_PER_SEG: 2.2,
  DOT_MIN_SECONDS: 4,
  /** Đoạn đường mang tên kiểu "G1", "S2", "X3", "Y4" hoặc chữ Hán (nhiễu của OSM) bị bỏ khỏi bản vẽ. */
  NOISE_ROAD_NAME: /^[GSXY]\d/i,
  CJK: /[㐀-鿿]/,
} as const;
