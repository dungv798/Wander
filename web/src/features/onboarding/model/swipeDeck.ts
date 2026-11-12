/** The swipe direction: right = choose, left = skip. */
export type SwipeKind = 'pick' | 'skip';

/** The deck state: the top card and which card flew away in which direction. */
export interface DeckState {
  readonly cur: number;
  readonly flights: Readonly<Record<number, SwipeKind>>;
}

/** The actions on the deck: swipe the top card, or reset from the start. */
export type DeckAction = { readonly type: 'commit'; readonly kind: SwipeKind; readonly total: number } | { readonly type: 'reset' };

/** A deck where no card has been swiped. */
export const EMPTY_DECK: DeckState = { cur: 0, flights: {} };

/** Updates the deck; swiping when the cards have run out is ignored (it does not exceed the total number of cards). */
export function deckReducer(state: DeckState, action: DeckAction): DeckState {
  if (action.type === 'reset') return EMPTY_DECK;
  if (state.cur >= action.total) return state;
  return { cur: state.cur + 1, flights: { ...state.flights, [state.cur]: action.kind } };
}

/** The number of places chosen (swiped right) in the deck. */
export function pickedCount(state: DeckState): number {
  return Object.values(state.flights).filter((k) => k === 'pick').length;
}
