import type { IconName } from './iconPaths.const.ts';

/** Chỉ dùng trong ngữ cảnh ngữ nghĩa; thiếu hình đúng nghĩa thì giữ Tabler. */
export const FLUENT_ICONS: Readonly<Partial<Record<IconName, string>>> = {
  trees: 'national_park',
  columns: 'classical_building',
  'tools-kitchen-2': 'fork_and_knife',
  mountain: 'mountain',
  bed: 'bed',
  'rosette-discount-check': 'glowing_star',
  heart: 'orange_heart',
  sunrise: 'sunrise',
  sun: 'sun',
  'sunset-2': 'sunset',
  'moon-stars': 'crescent_moon',
  'map-pin': 'round_pushpin',
  motorbike: 'motorcycle',
  'calendar-event': 'calendar',
  backpack: 'backpack',
  compass: 'compass',
};

/** Khung PNG cố định, không lấy kích thước ảnh gốc làm kích thước bố cục. */
export const FLUENT_SIZE = { s: 24, default: 24, l: 32, xl: 40 } as const;
export const FLUENT_PATH = '/look/icons/';
export const FLUENT_SUFFIX = '_3d.png';
