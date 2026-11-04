import type { SampleDay, SceneKind } from './onboarding.types.ts';

/** Điểm đến của phần giới thiệu. */
export const ONBOARD_DESTINATION = 'da-lat';

/** Thứ tự bốn cảnh. */
export const SCENES: readonly SceneKind[] = ['discover', 'swipe', 'plan', 'share'];
/** Chỉ số các cảnh (khớp `SCENES`). */
export const SCENE = { DISCOVER: 0, SWIPE: 1, PLAN: 2, SHARE: 3 } as const;

/** Ảnh dựng sẵn của minh họa (phục vụ từ `public/onboard`). */
export const ART = {
  PLANE: '/onboard/plane.webp',
  COMPASS: '/onboard/compass.webp',
  BINOCULARS: '/onboard/binoculars.webp',
  CLOUDS: ['/onboard/cloud1.webp', '/onboard/cloud2.webp', '/onboard/cloud3.webp', '/onboard/cloud1.webp'],
} as const;

/** Ba điểm đến làm thẻ xòe của cảnh mở đầu (mã điểm đến; thẻ đầu là thẻ chính, cũng là điểm đến của câu chuyện sau đó). */
export const FAN_DESTINATIONS: readonly string[] = ['da-lat', 'ha-giang', 'ta-xua'];

/** Bộ thẻ cảnh quẹt: thẻ 1 có trong lịch mẫu (demo chọn), thẻ 2 nằm ngoài lịch mẫu (demo bỏ qua); lịch mẫu KHÔNG phụ thuộc lựa chọn của người xem. */
export const DECK_IDS: readonly string[] = ['nha-tho-con-ga', 'thac-prenn', 'ga-da-lat', 'linh-phuoc', 'thac-datanla', 'cho-da-lat'];

/** Ảnh đẹp nhất của từng địa điểm cho phần giới thiệu (chỉ số trong danh sách ảnh của kho): chọn theo độ phân giải, độ nét và độ rực màu, cắt dọc vẫn đủ nét. Địa điểm không có ở đây dùng ảnh đầu. */
export const PLACE_PHOTO_INDEX: Readonly<Record<string, number>> = { 'nha-tho-con-ga': 1, 'thac-prenn': 1, 'thac-datanla': 1 };

/** Ảnh riêng cho thẻ điểm đến ở cảnh mở đầu (ảnh có giấy phép trong kho) và điểm lấy nét khi cắt thẻ cao. */
export const DESTINATION_PHOTOS: Readonly<Record<string, { readonly url: string; readonly position: string }>> = {
  'da-lat': { url: '/catalog/photos/nha-tho-con-ga-2.jpg', position: 'center' },
  'ha-giang': { url: '/catalog/photos/hoang-su-phi-2.jpg', position: 'center 60%' },
  'ta-xua': { url: '/catalog/photos/ta-xua-1.jpg', position: '38% center' },
};

/** Hình học và nhịp của cảnh quẹt (px, ms). */
export const SWIPE = {
  DRAG_PX: 96,
  TILT_PER_PX: 0.06,
  USER_COMMIT_PX: 80,
  STAMP_FULL_PX: 90,
  LIT_AT: 0.45,
  INTRO_MS: 450,
  FINGER_IN_MS: 300,
  PRESS_MS: 140,
  DRAG_MS: 850,
  HOLD_MS: 350,
  RELEASE_MS: 100,
  AFTER_FLY_MS: 800,
  BUTTONS_HINT_MS: 1700,
  END_PAUSE_MS: 1500,
  SETTLE_MS: 460,
  FAR_DEPTH: 2,
  CHIP_MS: 720,
  FINGER_Y_RATIO: 0.7,
  DRAG_DY_PX: 6,
  USER_DY_RATIO: 0.35,
  LIT_USER_PX: 40,
  THUMB_STEP_PX: 25,
  THUMB_R_PX: 17,
  THUMB_LEFT_PX: 18,
  THUMB_BOTTOM_PX: 82,
} as const;

/** Lịch mẫu cố định "Đà Lạt · 2 ngày thong thả". Ngày 1 đi quanh khu trung tâm (tây → đông dọc hồ rồi về chợ buổi tối); Ngày 2 đi một chiều bắc → nam từ thiền viện xuống thác Datanla rồi hồ Tuyền Lâm. Khung buổi lấy theo `bestSlots` của kho. */
export const SAMPLE_TRIP: readonly SampleDay[] = [
  {
    theme: 'center',
    items: [
      { placeId: 'nha-tho-con-ga', slot: 'morning', note: 'church' },
      { placeId: 'quang-truong-lam-vien', slot: 'afternoon', note: 'square' },
      { placeId: 'ho-xuan-huong', slot: 'dusk', note: 'lake' },
      { placeId: 'cho-da-lat', slot: 'evening', note: 'market' },
    ],
  },
  {
    theme: 'south',
    items: [
      { placeId: 'thien-vien-truc-lam', slot: 'morning', note: 'monastery' },
      'lunch',
      { placeId: 'thac-datanla', slot: 'afternoon', note: 'waterfall' },
      { placeId: 'ho-tuyen-lam', slot: 'lateAfternoon', note: 'reservoir' },
    ],
  },
];

/** Đề xuất của thành viên ở cảnh chia sẻ: thêm một địa điểm cùng hướng vào đầu một ngày (chỉ số ngày bắt đầu từ 0). */
export const PROPOSAL = { placeId: 'ga-da-lat', dayIndex: 1, slot: 'morning', by: 'Mai' } as const;

/** Thành viên minh họa của cảnh chia sẻ: tên hiển thị và khóa màu. */
export const MEMBERS = [
  { id: 'me', name: 'Bạn', tone: 'me' },
  { id: 'mai', name: 'Mai', tone: 'a' },
  { id: 'bao', name: 'Bảo', tone: 'b' },
] as const;

/** Nhịp của cảnh bản đồ (ms) và khoảng đệm khi vừa khung (px). */
export const PLAN_TIMING = {
  OVERVIEW_MS: 1400,
  DAY_ZOOM_MS: 1000,
  PIN_MS: 1000,
  BREAK_MS: 650,
  DAY_END_MS: 500,
  LAST_DAY_END_MS: 900,
  FINALE_MS: 1800,
  MAP_WAIT_MS: 6000,
} as const;

/** Nhịp của cảnh chia sẻ (ms). */
export const SHARE_TIMING = {
  START_MS: 600,
  TAP_MOVE_MS: 500,
  TAP_PRESS_MS: 140,
  TAP_AFTER_MS: 250,
  AFTER_SHARE_MS: 700,
  JOIN_FIRST_MS: 450,
  JOIN_NEXT_MS: 650,
  JOIN_AFTER_MS: 550,
  BEFORE_PROPOSAL_MS: 250,
  PROPOSAL_READ_MS: 1500,
  END_MS: 2600,
  MANUAL_PROPOSAL_MS: 450,
} as const;

/** Tự chuyển cảnh mở đầu sau (ms) khi người xem chưa chạm vào gì. */
export const DISCOVER_AUTO_MS = 3000;
/** Thời gian chuyển cảnh (ms): cảnh cũ trượt ra, cảnh mới trượt vào. */
export const TRANSITION_MS = 420;
/** Thời gian thẻ dùng chung bay từ cảnh này sang cảnh kia (ms); nhỏ hơn nhịp mở đầu demo quẹt để demo bắt đầu khi thẻ đã vào chỗ. */
export const MORPH_MS = 460;
/** Thông báo ngắn tự tắt sau (ms). */
export const TOAST_MS = 2200;
/** Bản đồ chưa sẵn sàng sau chừng này thì hiện sơ đồ minh họa thay thế. */
export const MAP_FALLBACK_MS = 6000;
/** Khoảng đệm quanh các ghim khi vừa khung bản đồ (px). */
export const MAP_PADDING = 36;
