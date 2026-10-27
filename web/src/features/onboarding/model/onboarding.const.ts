import type { IconName } from '../../../shared/ui/icons/iconPaths.const.ts';

/** Ba cảnh giới thiệu: cảnh mời gọi (ảnh bìa), cảnh quẹt (bộ bài tự chạy), cảnh xếp lịch (bản đồ + hai ngày). */
export type SceneKind = 'invite' | 'swipe' | 'plan';

/** Một bước giới thiệu: loại cảnh và địa điểm trong kho dùng làm ảnh/chữ của cảnh. */
export interface OnboardStep {
  readonly scene: SceneKind;
  readonly placeId: string;
  readonly icon: IconName;
}

/** Các bước theo thứ tự. Địa điểm đều có thật trong kho biên tập Hà Giang; thiếu địa điểm thì cảnh dùng ảnh nền màu. */
export const ONBOARD_STEPS: readonly OnboardStep[] = [
  { scene: 'invite', placeId: 'hoang-su-phi', icon: 'map-pin' },
  { scene: 'swipe', placeId: 'deo-ma-pi-leng', icon: 'map-pin' },
  { scene: 'plan', placeId: 'song-nho-que', icon: 'map-pin' },
];

/** Ba thẻ của bộ bài tự quẹt: thẻ 2 bị quẹt trái, hai thẻ còn lại quẹt phải (khớp CSS `obs-card`). */
export const SWIPE_DEMO: readonly string[] = ['cot-co-lung-cu', 'song-nho-que', 'pho-co-dong-van'];
/** Chỉ số thẻ trong bộ bài demo bị quẹt trái (bỏ qua). */
export const SWIPE_DEMO_SKIPPED = 1;

/** Hai ngày xếp sẵn của cảnh 3; ngày 1 vẽ tuyến trên bản đồ. */
export const PLAN_DEMO: readonly (readonly string[])[] = [
  ['cot-co-lung-cu', 'pho-co-dong-van'],
  ['deo-ma-pi-leng', 'song-nho-que'],
];

/** Điểm đến của phần giới thiệu. */
export const ONBOARD_DESTINATION = 'ha-giang';

/** Khoảng trống chừa quanh các ghim khi vừa khung bản đồ cảnh 3 (px). */
export const PLAN_MAP_PADDING = 40;

/** Các số của bộ đếm "Đã chọn" (0 → 1 → 2), khớp hoạt họa CSS `n0`, `n1`, `n2`. */
export const COUNTER_STEPS = [0, 1, 2] as const;
