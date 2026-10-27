import { COPY, fill } from '../../../shared/const/copy.vi.ts';
import { SWIPE } from '../../../shared/const/app.const.ts';
import { VIEW } from '../../../shared/const/routes.const.ts';
import { navigate } from '../../../shared/router/hashRoute.ts';
import { useFocusOnMount } from '../../../shared/hooks/useFocusOnMount.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { useDiscover } from '../hooks/DiscoverProvider.tsx';
import { useDeck } from '../hooks/useDeck.ts';
import type { AddingMode } from '../model/addingMode.ts';
import type { DestinationDetail } from '../model/Catalog.types.ts';
import { pickedOf } from '../model/discoverState.ts';
import { DestinationGate } from './DestinationGate.tsx';
import { DeckActions } from './deck/DeckActions.tsx';
import { DeckBar, DeckFilters } from './deck/DeckHeader.tsx';
import { SwipeCard } from './deck/SwipeCard.tsx';

/** Màn "Hết thẻ rồi": nói rõ vì sao (đã hết, hay hết ở loại này) và cho đường đi tiếp. */
function DeckEmpty({ dest, adding }: { readonly dest: DestinationDetail; readonly adding?: AddingMode }) {
  const { state, actions } = useDiscover();
  const picked = pickedOf(state, dest.places).length;
  const heading = useFocusOnMount<HTMLHeadingElement>();
  const text = adding ? COPY.deck.addingEmpty : state.cat !== 'all' ? COPY.deck.emptyCategory : fill(COPY.deck.emptyDone, { n: picked, dest: dest.name });
  return (
    <div className="empty pad-x deck-empty" role="status">
      <h2 className="h2" ref={heading} tabIndex={-1}>{COPY.deck.emptyTitle}</h2>
      <p>{text}</p>
      <Button onClick={() => (adding ? adding.onDone() : navigate(VIEW.PICKED))}>{adding ? COPY.deck.addingBack : COPY.deck.viewPickedBtn}</Button>
      {adding ? null : (
        <>
          <Button kind="ghost" onClick={actions.undo}>
            {COPY.deck.undoLast}
          </Button>
          <Button kind="ghost" onClick={actions.restart}>
            {COPY.deck.restart}
          </Button>
        </>
      )}
    </div>
  );
}

/** Một cột duy nhất (thanh trên, bộ lọc, thẻ cùng chiều rộng); hết thẻ thì chuyển sang màn sáng bình thường. Bộ bài đang quẹt: tối đa 3 thẻ (thẻ trên cùng nhận cử chỉ), hàng nút và phím tắt (←, →, ↑, Backspace/Z). */
function DeckContent({ dest, adding }: { readonly dest: DestinationDetail; readonly adding?: AddingMode }) {
  const { state, left, front, deckRef, handlers, swipeTop, openFront, undo } = useDeck(dest, adding);
  const visible = left.slice(0, SWIPE.VISIBLE_CARDS);
  return (
    <div className="deckcol">
      <DeckBar dest={dest} adding={adding} />
      <DeckFilters dest={dest} />
      {front ? (
        <div className="deckwrap">
          <div className="deck" ref={deckRef}>
            {visible
              .map((p, depth) => <SwipeCard key={p.id} place={p} depth={depth} photoIndex={state.photo[p.id] ?? 0} handlers={depth === 0 ? handlers : undefined} />)
              .reverse()}
          </div>
          <DeckActions canUndo={!adding && state.history.length > 0} onUndo={undo} onSwipe={swipeTop} onInfo={openFront} />
        </div>
      ) : (
        <DeckEmpty dest={dest} adding={adding} />
      )}
    </div>
  );
}

/** Màn quẹt thẻ toàn màn (ẩn thanh điều hướng trên điện thoại để thẻ chiếm trọn màn hình). */
export function DeckScreen({ destId, adding }: { readonly destId: string; readonly adding?: AddingMode }) {
  return (
    <DestinationGate destId={destId} inDeck>
      {(dest) => <DeckContent dest={dest} adding={adding} />}
    </DestinationGate>
  );
}
