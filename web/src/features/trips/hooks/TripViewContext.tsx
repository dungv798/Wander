import { createContext, useContext } from 'react';
import type { ItemKind, Trip } from '../model/trip.types.ts';
import type { TripCatalog } from '../model/tripView.ts';
import type { MealGap } from '../model/mealGaps.ts';

/** The overlay sheet open on the trip screen (only one at a time). */
export type Overlay =
  | { readonly kind: 'mealSuggest'; readonly day: string; readonly gap: MealGap }
  | { readonly kind: 'add' }
  | { readonly kind: 'editor'; readonly itemId: string | null; readonly preset: ItemKind | null }
  | { readonly kind: 'editTrip' }
  | { readonly kind: 'cover' }
  | { readonly kind: 'costDetail' }
  | { readonly kind: 'unassigned' }
  | { readonly kind: 'checklist' }
  | { readonly kind: 'costAdd' }
  | { readonly kind: 'plan' }
  | { readonly kind: 'addToDay' }
  | { readonly kind: 'pickDay'; readonly itemId: string }
  | { readonly kind: 'trash' }
  | { readonly kind: 'deleteTrip' }
  | { readonly kind: 'people' }
  | { readonly kind: 'share' }
  | { readonly kind: 'requests' }
  | { readonly kind: 'requestDelete'; readonly itemId: string };

/** Everything the child components of the trip screen need: the trip + destination data, the tab, the overlay sheets, the reorder mode and the shared actions. */
export interface TripViewValue {
  readonly trip: Trip;
  readonly cat: TripCatalog;
  /** Every day of the trip in order. */
  readonly days: readonly string[];
  /** `ov` (overview) or the day number 1..n as a string. */
  readonly tab: string;
  readonly setTab: (tab: string) => void;
  readonly setOverlay: (o: Overlay | null) => void;
  readonly sorting: boolean;
  readonly setSorting: (v: boolean) => void;
  /** Opens an item: a place -> the detail sheet with the trip's buttons; a free-form item -> the editor. */
  readonly openItem: (itemId: string) => void;
  /** Goes to the deck to add places to this trip. */
  readonly addMore: () => void;
  /** Reads a notice aloud for screen readers. */
  readonly announce: (text: string) => void;
}

const TripViewContext = createContext<TripViewValue | null>(null);

/** The context provider of the trip screen. */
export const TripViewProvider = TripViewContext.Provider;

/** Access to the trip-screen context; throws if used outside `TripViewProvider`. */
export function useTripView(): TripViewValue {
  const ctx = useContext(TripViewContext);
  if (!ctx) throw new Error('useTripView phải nằm trong TripViewProvider');
  return ctx;
}
