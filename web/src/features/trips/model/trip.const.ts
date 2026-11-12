import type { IconName } from '../../../shared/ui/icons/iconPaths.const.ts';
import type { ItemKind } from './trip.types.ts';

/** The properties of each item kind. `plain` = Rest/To-do: no price, no booking (the backend's `ItemType.isPriced`/`supportsBooking`). */
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

/** The display order of the item kinds (kind choice, total by kind). */
export const KIND_ORDER: readonly ItemKind[] = ['sightseeing', 'food', 'transport', 'lodging', 'car_rental', 'shopping', 'tour', 'rest', 'task'];

/** The item kind inferred from the place kind in the catalog when adding a place to a trip. */
export const PLACE_KIND: Readonly<Record<string, ItemKind>> = { canh: 'sightseeing', van: 'sightseeing', leo: 'sightseeing', am: 'food', luu: 'lodging', cho: 'shopping' };

/** The trip style (choose several, at most `LIMITS.MAX_STYLES`) and pace (choose one): labels only (Q11, DR-002). The codes match the backend. */
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

/** 'Who is going' in the step-by-step trip wizard: the trip-kind labels, not a member list yet (F2). */
export const TRIP_KINDS: readonly { readonly code: string; readonly label: string }[] = [
  { code: 'solo', label: 'Một mình' },
  { code: 'family', label: 'Gia đình' },
  { code: 'friends', label: 'Bạn bè' },
  { code: 'couple', label: 'Cặp đôi' },
  { code: 'work', label: 'Công việc' },
];

/** The Vietnamese label of a trip-kind code; an unknown code (newly added by the backend) is shown as the raw code. */
export function kindLabel(code: string): string {
  return TRIP_KINDS.find((k) => k.code === code)?.label ?? code;
}

/** The number of steps of the step-by-step trip wizard. */
export const WIZARD_STEPS = ['where', 'when', 'who', 'interests', 'budget', 'review'] as const;
export type WizardStep = (typeof WIZARD_STEPS)[number];

/** Saturday is the suggested start day of a new trip (like the prototype); a trip defaults to 3 days. */
export const DEFAULT_START_WEEKDAY = 6;
export const DEFAULT_TRIP_DAYS = 3;
export const DAYS_IN_WEEK = 7;
/** The two nearest days on the card; the other days use the shared picker so the card does not grow with the number of days of the trip. */
export const QUICK_ASSIGN_DAYS = 2;

/** The draggable-sheet steps of the trip screen. */
export type SheetSnap = 'peek' | 'half' | 'full';
