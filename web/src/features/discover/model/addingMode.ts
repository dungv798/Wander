/** The 'add places to a trip' mode: the deck skips the places already in the trip; swiping right adds directly to the trip instead of to 'Selected'. Wired by the `app` layer to the trips feature. */
export interface AddingMode {
  /** The trip name shown at the top of the deck. */
  readonly title: string;
  /** The ids of the places already in the trip (not shown again). */
  readonly excludeIds: readonly string[];
  /** Adds one place to the trip. */
  readonly onAdd: (place: { readonly id: string; readonly category: string }) => void;
  /** Done: back to the trip. */
  readonly onDone: () => void;
}
