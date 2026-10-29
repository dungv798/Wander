import type { IconName } from '../../../shared/ui/icons/iconPaths.const.ts';
import type { ItemKind } from './trip.types.ts';

/** Thuộc tính của từng loại mục. `plain` = Nghỉ/Việc cần làm: không giá, không đặt chỗ (`ItemType.isPriced`/`supportsBooking` của backend). */
export const ITEM_KINDS: Readonly<Record<ItemKind, { readonly label: string; readonly icon: IconName; readonly cat: string; readonly plain: boolean }>> = {
  sightseeing: { label: 'Tham quan', icon: 'map-pin', cat: 'cat-canh', plain: false },
  food: { label: 'Ăn uống', icon: 'tools-kitchen-2', cat: 'cat-am', plain: false },
  transport: { label: 'Di chuyển', icon: 'route', cat: 'cat-leo', plain: false },
  lodging: { label: 'Lưu trú', icon: 'bed', cat: 'cat-luu', plain: false },
  car_rental: { label: 'Thuê xe', icon: 'key', cat: 'cat-leo', plain: false },
  shopping: { label: 'Mua sắm', icon: 'building-store', cat: 'cat-cho', plain: false },
  tour: { label: 'Tour/Combo', icon: 'users', cat: 'cat-van', plain: false },
  rest: { label: 'Nghỉ', icon: 'moon-stars', cat: 'cat-luu', plain: true },
  task: { label: 'Việc cần làm', icon: 'list-check', cat: 'cat-canh', plain: true },
};

/** Thứ tự hiển thị các loại mục (chọn loại, tổng theo loại). */
export const KIND_ORDER: readonly ItemKind[] = ['sightseeing', 'food', 'transport', 'lodging', 'car_rental', 'shopping', 'tour', 'rest', 'task'];

/** Loại mục suy ra từ loại địa điểm trong kho khi thêm địa điểm vào chuyến. */
export const PLACE_KIND: Readonly<Record<string, ItemKind>> = { canh: 'sightseeing', van: 'sightseeing', leo: 'sightseeing', am: 'food', luu: 'lodging', cho: 'shopping' };

/** Kiểu chuyến (chọn nhiều, tối đa `LIMITS.MAX_STYLES`) và nhịp (chọn một): chỉ là nhãn (Q11, DR-002). Mã trùng backend. */
export const TRIP_STYLES: readonly { readonly code: string; readonly label: string }[] = [
  { code: 'relax', label: 'Nghỉ dưỡng' },
  { code: 'explore', label: 'Khám phá' },
  { code: 'food', label: 'Ẩm thực' },
  { code: 'beach', label: 'Biển' },
  { code: 'mountain', label: 'Núi' },
  { code: 'city', label: 'Thành phố' },
  { code: 'family', label: 'Gia đình' },
  { code: 'friends', label: 'Bạn bè' },
];
export const TRIP_PACES: readonly { readonly code: string; readonly label: string }[] = [
  { code: 'relaxed', label: 'Thoải mái' },
  { code: 'moderate', label: 'Vừa' },
  { code: 'packed', label: 'Dày' },
];

/** "Ai đi" ở bước tạo chuyến theo bước: nhãn kiểu chuyến, chưa phải danh sách thành viên (F2). */
export const TRIP_KINDS: readonly { readonly code: string; readonly label: string }[] = [
  { code: 'solo', label: 'Một mình' },
  { code: 'family', label: 'Gia đình' },
  { code: 'friends', label: 'Bạn bè' },
  { code: 'couple', label: 'Cặp đôi' },
  { code: 'work', label: 'Công việc' },
];

/** Nhãn tiếng Việt của một mã kiểu chuyến; mã lạ (backend thêm mới) thì hiện nguyên mã. */
export function kindLabel(code: string): string {
  return TRIP_KINDS.find((k) => k.code === code)?.label ?? code;
}

/** Số bước của trình tạo chuyến theo bước. */
export const WIZARD_STEPS = ['where', 'when', 'who', 'interests', 'budget', 'review'] as const;
export type WizardStep = (typeof WIZARD_STEPS)[number];

/** Thứ Bảy là ngày gợi ý bắt đầu chuyến mới (giống prototype); chuyến mặc định 3 ngày. */
export const DEFAULT_START_WEEKDAY = 6;
export const DEFAULT_TRIP_DAYS = 3;
export const DAYS_IN_WEEK = 7;

/** Nấc tờ kéo của màn chuyến đi. */
export type SheetSnap = 'peek' | 'half' | 'full';
