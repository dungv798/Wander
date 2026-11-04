/** Hướng quẹt: phải = chọn, trái = bỏ qua. */
export type SwipeKind = 'pick' | 'skip';

/** Trạng thái bộ bài: thẻ trên cùng và thẻ nào đã bay đi theo hướng nào. */
export interface DeckState {
  readonly cur: number;
  readonly flights: Readonly<Record<number, SwipeKind>>;
}

/** Hành động lên bộ bài: quẹt thẻ trên cùng, hoặc đặt lại từ đầu. */
export type DeckAction = { readonly type: 'commit'; readonly kind: SwipeKind; readonly total: number } | { readonly type: 'reset' };

/** Bộ bài chưa quẹt thẻ nào. */
export const EMPTY_DECK: DeckState = { cur: 0, flights: {} };

/** Cập nhật bộ bài; quẹt khi đã hết thẻ thì bỏ qua (không vượt quá tổng số thẻ). */
export function deckReducer(state: DeckState, action: DeckAction): DeckState {
  if (action.type === 'reset') return EMPTY_DECK;
  if (state.cur >= action.total) return state;
  return { cur: state.cur + 1, flights: { ...state.flights, [state.cur]: action.kind } };
}

/** Số nơi đã chọn (quẹt phải) trong bộ bài. */
export function pickedCount(state: DeckState): number {
  return Object.values(state.flights).filter((k) => k === 'pick').length;
}
