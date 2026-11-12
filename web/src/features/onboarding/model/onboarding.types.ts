import type { DestinationDetail, PlaceView } from '../../discover/index.ts';

/** The four intro scenes: explore, swipe to choose, the itinerary on the map, share with a group. */
export type SceneKind = 'discover' | 'swipe' | 'plan' | 'share';

/** The expected part of day of an item in the sample itinerary (not an exact time). */
export type SlotKey = 'morning' | 'noon' | 'afternoon' | 'lateAfternoon' | 'dusk' | 'evening';

/** An item of the sample itinerary by place id in the catalog; `note` is the key of a short note in the display copy. */
export interface SampleStop {
  readonly placeId: string;
  readonly slot: SlotKey;
  readonly note: string;
}

/** One day of the sample itinerary: the theme key and the items in visiting order (`lunch` is a break, not a place). */
export interface SampleDay {
  readonly theme: string;
  readonly items: readonly (SampleStop | 'lunch')[];
}

/** A place on the built itinerary: the ordinal number in the day (1, 2, 3...) matching the pin number on the map. */
export interface TripStop {
  readonly kind: 'stop';
  readonly place: PlaceView;
  readonly slot: SlotKey;
  readonly note: string;
  readonly num: number;
  /** The proposer's name if this item was just accepted by the trip owner; null for the original itinerary. */
  readonly proposedBy: string | null;
}

/** A break in the day (lunch): it has a line in the list but no pin. */
export interface TripBreak {
  readonly kind: 'break';
  readonly slot: SlotKey;
}

/** An item of the built itinerary. */
export type TripItem = TripStop | TripBreak;

/** One day of the itinerary built from real data. */
export interface TripDay {
  readonly index: number;
  readonly theme: string;
  readonly items: readonly TripItem[];
}

/** The props shared by every scene: the destination data, reduced motion, whether it still runs by itself, and two ways to report to the frame (scene done / the viewer touched). */
export interface SceneProps {
  readonly dest: DestinationDetail;
  readonly reduced: boolean;
  readonly auto: boolean;
  /** The scene has finished its story and wants to go to the next by itself (the frame does it only while it still runs by itself). */
  readonly onDone: () => void;
  /** The viewer touches the scene's content: stops auto-advancing the scene. */
  readonly onInteract: () => void;
  /** A heads-up to the viewer: it will change by itself after `ms` milliseconds (0 = the last scene has finished, hints at the start button). The frame draws the sign on the progress dot. */
  readonly onCue: (ms: number) => void;
}
