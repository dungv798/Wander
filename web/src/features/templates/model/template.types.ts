import type { PlaceView } from '../../discover/index.ts';

/** The content review state: `draft` = a draft waiting for PO approval (DR-018 N-2), `approved` = approved. */
export type TemplateStatus = 'draft' | 'approved' | 'reference';

/** One day of a sample itinerary: the places (in visiting order) and an optional editorial note. */
export interface TemplateDay {
  readonly places: readonly PlaceView[];
  readonly note: string | null;
}

/** A sample itinerary joined with the place catalog: only places that REALLY exist in the catalog, no times/prices/ratings. */
export interface TemplateView {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly status: TemplateStatus;
  readonly days: readonly TemplateDay[];
  /** The total number of different places. */
  readonly placeCount: number;
}
