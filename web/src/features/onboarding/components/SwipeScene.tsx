import { useCallback, useMemo, useRef } from 'react';
import { placeById } from '../../discover/index.ts';
import type { PlaceView } from '../../discover/index.ts';
import { useArrowKeys } from '../hooks/useArrowKeys.ts';
import { useCardDrag } from '../hooks/useCardDrag.ts';
import { useSelectedTray } from '../hooks/useSelectedTray.ts';
import { useSwipeDeck } from '../hooks/useSwipeDeck.ts';
import { useSwipeStory } from '../hooks/useSwipeStory.ts';
import { DECK_IDS } from '../model/onboarding.const.ts';
import { ONBOARD_COPY as T } from '../model/onboarding.copy.ts';
import type { SceneProps } from '../model/onboarding.types.ts';
import type { SwipeKind } from '../model/swipeDeck.ts';
import { CaptionPill, DeckDone, ReplayButton, StaticSwipe } from './SwipeParts.tsx';
import { SelectedTrayView, SwipeControls } from './SwipeControls.tsx';
import { SwipeCard } from './SwipeCard.tsx';
import { TouchDot } from './TouchDot.tsx';

/** The swipe stage: the deck, the illustrative touch dot, the caption, the selected tray, the two buttons and 'Watch again'. */
function SwipeStage({ places, auto, onDone, onInteract, onCue }: Pick<SceneProps, 'auto' | 'onDone' | 'onInteract' | 'onCue'> & { readonly places: readonly PlaceView[] }) {
  const stage = useRef<HTMLDivElement | null>(null);
  const cardEls = useRef<(HTMLElement | null)[]>([]);
  const { state, dragging, snapping, setDragging, commit: deckCommit, reset } = useSwipeDeck(places.length);
  const { thumbs, chips, fly, land, clear } = useSelectedTray(stage);
  const resetAll = useCallback(() => {
    reset();
    clear();
  }, [reset, clear]);
  const commit = useCallback(
    /** Swipes the top card; if chosen the shrunken photo flies down to the tray. */
    (kind: SwipeKind) => {
      const el = cardEls.current[state.cur];
      const place = places[state.cur];
      if (deckCommit(kind) && kind === 'pick' && el && place) fly(place, el.getBoundingClientRect());
    },
    [deckCommit, state.cur, places, fly],
  );
  const story = useSwipeStory({ stage, cardEls, cur: state.cur, commit, setDragging, resetAll, auto, onDone, onInteract, onCue });
  const { interrupt, setLit } = story;
  const drag = useCardDrag({ onStart: () => { interrupt(); setDragging(state.cur); }, onLean: setLit, onCommit: commit, onCancel: () => setDragging(null) });
  const act = useCallback(
    /** The X/check buttons or the arrow keys: the viewer swipes by themself. */
    (kind: SwipeKind) => {
      interrupt();
      commit(kind);
    },
    [interrupt, commit],
  );
  useArrowKeys(act);
  const finished = state.cur >= places.length;
  return (
    <div ref={stage} className={`ob-scene ob-swipe${snapping ? ' snap' : ''}`} data-focus={story.focus ?? undefined}>
      <div className="ob-deck">
        {places.map((p, i) => (
          <SwipeCard key={p.id} place={p} depth={i - state.cur} flight={state.flights[i]} dragging={dragging === i} cardRef={(el) => { cardEls.current[i] = el; }} drag={i === state.cur && !finished ? drag : null} />
        ))}
      </div>
      <CaptionPill caption={story.caption} />
      <TouchDot mark={story.touch} />
      {finished ? <DeckDone picks={thumbs} /> : null}
      <SelectedTrayView thumbs={thumbs} chips={chips} onLanded={land} />
      <SwipeControls lit={story.lit} hint={finished ? T.swipe.hintDone : story.hint} onAct={act} />
      <ReplayButton story={story} onClick={story.replay} />
    </div>
  );
}

/** Scene 2: swipe to choose. The demo runs one round by itself (dragging and releasing in both directions); the viewer touching it stops the demo and they try swiping themself. */
export function SwipeScene({ dest, reduced, auto, onDone, onInteract, onCue }: SceneProps) {
  const places = useMemo(() => DECK_IDS.flatMap((id) => placeById(dest, id) ?? []), [dest]);
  if (reduced) return <StaticSwipe places={places} />;
  return <SwipeStage places={places} auto={auto} onDone={onDone} onInteract={onInteract} onCue={onCue} />;
}
