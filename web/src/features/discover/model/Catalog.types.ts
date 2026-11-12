/** The data contract of the editorial catalog, matching the backend's `CatalogViews` (backend/src/main/java/com/wander/catalog/application/query). */

/** The place kind code (`PlaceCategory`). */
export type CategoryCode = 'canh' | 'van' | 'am' | 'leo' | 'luu' | 'cho';

/** The editorial label code in place of a star score (`Verdict`, DR-007): Wander's opinion, NOT a user rating. */
export type VerdictCode = 'must' | 'worth' | 'ifconv';

/** The best time to go (`TimeSlot`). */
export type SlotCode = 'sang' | 'trua' | 'chieu' | 'toi';

/** The layout kind of a guide block. */
export type GuideLayout = 'months' | 'checklist' | 'cards' | 'places' | 'rows';

/** A photo with the author's attribution and the license (required to be shown). */
export interface PhotoView {
  /** Stable photo id (file name without width/hash suffix); trip covers persist it. Null for external photos. */
  readonly id?: string | null;
  /** 480 px variant for lists and cards; null when the photo has a single size or is external. */
  readonly thumbUrl?: string | null;
  /** `srcset` value listing the available widths; null when there is only one. */
  readonly srcSet?: string | null;
  readonly authorUrl?: string;
  readonly caption?: string;
  readonly url: string;
  readonly author: string;
  readonly license: string;
  readonly sourceUrl: string;
}

/** A life theme edited by the backend. */
export type MomentTheme = 'cho' | 'mon-an' | 'nguoi' | 'le-hoi' | 'nghe' | 'hanh-trinh';

/** An atmosphere photo at destination level, with full attribution information. */
export interface MomentView {
  readonly id: string;
  readonly theme: MomentTheme;
  readonly themeLabel: string;
  readonly caption: string;
  readonly photo: PhotoView;
}

/** 'How far' from a landmark (a mountain-road estimate, not directions). */
export interface Away {
  readonly refId: string;
  readonly refName: string;
  readonly km: number;
  readonly minutes: number;
  readonly approximate: boolean;
}

/** A place in the editorial catalog. */
export interface PlaceView {
  readonly venue?: VenueView | null;
  readonly id: string;
  readonly name: string;
  readonly category: CategoryCode;
  readonly categoryName: string;
  readonly area: string;
  readonly hook: string;
  readonly summary: string;
  readonly lat: number | null;
  readonly lon: number | null;
  readonly bestMonths: readonly number[];
  readonly bestLabel: string;
  readonly duration: string;
  readonly difficulty: string;
  readonly highlights: readonly string[];
  readonly verdict: VerdictCode;
  readonly verdictLabel: string;
  readonly verdictReason: string;
  readonly bestSlots: readonly SlotCode[];
  readonly slotReason: string;
  readonly tips: readonly string[];
  readonly photos: readonly PhotoView[];
  readonly away: readonly Away[];
  readonly wikipediaTitle: string | null;
}

/** An establishment with a cross-check source; it does not mean the price/hours/vacancy have been verified. */
export interface VenueView {
  readonly kind: 'restaurant' | 'cafe' | 'bar' | 'lodging';
  readonly kindName: string;
  readonly address: string;
  readonly website: string;
  readonly sourceUrl: string;
  readonly checkedAt: string;
  readonly phone?: string;
  readonly serviceHours?: string;
  readonly priceNote?: string;
}

/** One item in a guide block (an icon, a title, a description, optionally pointing to a place). */
export interface GuideItemView {
  readonly icon: string;
  readonly title: string;
  readonly text: string;
  readonly placeId: string | null;
}

/** One guide block of a destination. */
export interface GuideSectionView {
  readonly id: string;
  readonly layout: GuideLayout;
  readonly category: CategoryCode;
  readonly icon: string;
  readonly title: string;
  readonly summary: string;
  readonly bestMonths: readonly number[];
  readonly rainyMonths: readonly number[];
  readonly notes: readonly string[];
  readonly items: readonly GuideItemView[];
}

/** A reference landmark for computing distance (for example Ha Giang city). */
export interface ReferenceView {
  readonly id: string;
  readonly name: string;
  readonly approximate: boolean;
  /** The landmark coordinates: NOT in the backend yet (`ReferenceView`); the fake catalog fills them in, the backend must add them before connecting (todo FE-10). */
  readonly lat?: number;
  readonly lon?: number;
}

/** A full destination: the guide + every place. */
export interface DestinationDetail {
  readonly id: string;
  readonly name: string;
  readonly region: string;
  readonly tagline: string;
  readonly coverUrl: string;
  /** The cover attribution is separate; an old API or test data may not return it yet. */
  readonly coverPhoto?: PhotoView;
  readonly references: readonly ReferenceView[];
  readonly guide: readonly GuideSectionView[];
  readonly places: readonly PlaceView[];
  readonly moments: readonly MomentView[];
}

/** A preview photo in the destination list. */
export interface Preview {
  readonly placeId: string;
  readonly name: string;
  readonly url: string;
}

/** The destination summary for the list and the search. */
export interface DestinationSummary {
  /** A real experience kind; an old API does not have it yet so it is only loaded to make up for it when the viewer filters. */
  readonly categories?: readonly CategoryCode[];
  readonly lat: number | null;
  readonly lon: number | null;
  readonly id: string;
  readonly name: string;
  readonly region: string;
  readonly tagline: string;
  readonly placeCount: number;
  readonly coverUrl: string;
  readonly coverPhoto?: PhotoView;
  readonly bestMonths: readonly number[];
  readonly previews: readonly Preview[];
}
