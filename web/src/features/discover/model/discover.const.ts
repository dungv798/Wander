import type { CategoryCode, SlotCode } from './Catalog.types.ts';
import type { IconName } from '../../../shared/ui/icons/iconPaths.const.ts';

/** The icon of each place kind; the kind name is decided by the editorial catalog (`categoryName`). */
export const CATEGORY_ICON: Readonly<Record<CategoryCode, IconName>> = {
  canh: 'trees', van: 'columns', am: 'tools-kitchen-2', leo: 'mountain', luu: 'bed', cho: 'building-store',
};

/** The kind name by code (matching the backend's `PlaceCategory`/`TripInterest`); used for the interests catalog. */
export const CATEGORY_NAME: Readonly<Record<CategoryCode, string>> = {
  canh: 'Cảnh quan', van: 'Văn hóa', am: 'Ẩm thực', leo: 'Leo núi', luu: 'Lưu trú', cho: 'Chợ',
};

/** The editorial label in place of a star score (DR-007; NO invented star numbers, G1). */
export const VERDICT_LABEL = { must: 'Nên ghé', worth: 'Đáng đi', ifconv: 'Chỉ ghé nếu tiện' } as const;

/** The display style of the editorial label block: the emphasis level and the icon. */
export const VERDICT_STYLE = {
  must: { cls: '', icon: 'rosette-discount-check' },
  worth: { cls: 'mid', icon: 'heart' },
  ifconv: { cls: 'low', icon: 'info-circle' },
} as const;

/** The part of day: code, icon. The label is in `COPY.slots`. */
export const SLOTS: readonly { readonly code: SlotCode; readonly icon: IconName }[] = [
  { code: 'sang', icon: 'sunrise' },
  { code: 'trua', icon: 'sun' },
  { code: 'chieu', icon: 'sunset-2' },
  { code: 'toi', icon: 'moon-stars' },
];

/** Other destinations 'coming soon' (no real data yet; only a list of text). */
export const COMING_SOON: readonly string[] = ['Sa Pa', 'Hội An', 'Đà Lạt', 'Ninh Bình', 'Phú Quốc', 'Đà Nẵng'];

/** The places used for the photo and illustration on the opening screen (ids that really exist in the editorial catalog). */
export const HOME_PLACES = {
  PASS: 'deo-ma-pi-leng',
  COVER: 'hoang-su-phi',
  RIVER: 'song-nho-que',
  LIVE_CARD: ['deo-ma-pi-leng', 'cot-co-lung-cu', 'song-nho-que', 'pho-co-dong-van'],
  PINS: [{ id: 'cot-co-lung-cu', cls: 'p1' }, { id: 'deo-ma-pi-leng', cls: 'p2' }],
  FAN: ['cao-nguyen-da', 'deo-ma-pi-leng', 'hoang-su-phi'],
  WALL: ['deo-ma-pi-leng', 'hoang-su-phi', 'song-nho-que', 'cot-co-lung-cu', 'pho-co-dong-van', 'cao-nguyen-da'],
  HIGHLIGHTS: ['deo-ma-pi-leng', 'hoang-su-phi', 'cot-co-lung-cu', 'cao-nguyen-da', 'dinh-vuong'],
} as const;

/** The focal point of the cover photo on a short frame: cuts the empty sky, keeps the part with content. */
export const COVER_FOCAL: Readonly<Record<string, string>> = { 'hoang-su-phi': '50% 78%' };
export const DEFAULT_FOCAL = '50% 50%';

/** The maximum size of the 'About this place' paragraph when collapsed (the number of lines is by CSS `.clamp`). */
export const ABOUT_MIN_LENGTH = 1;

/** The number of photos taken from the catalog for each home block. */
export const HOME_PREVIEW = { HERO: 3, WALL: 6, HIGHLIGHTS: 3, LIVE: 3, RIGHT: 2 } as const;
