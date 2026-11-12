import type { Ref } from 'react';
import { cssVars } from '../../../shared/lib/cssVars.ts';
import { fill } from '../../../shared/const/copy.vi.ts';
import { onboardPhotoUrl } from '../model/onboardPhotos.ts';
import type { PlaceView } from '../../discover/index.ts';
import type { CardDragHandlers } from '../hooks/useCardDrag.ts';
import { SWIPE } from '../model/onboarding.const.ts';
import { ONBOARD_COPY as T } from '../model/onboarding.copy.ts';
import type { SwipeKind } from '../model/swipeDeck.ts';

interface SwipeCardProps {
  readonly place: PlaceView;
  /** The position in the stack (0 = top). Negative = has flown away. */
  readonly depth: number;
  readonly flight: SwipeKind | undefined;
  readonly dragging: boolean;
  readonly cardRef: Ref<HTMLElement>;
  /** Only the top card receives a drag. */
  readonly drag: CardDragHandlers | null;
}

/** Combines the CSS classes of a card by state (rest, dragging, which direction it flew). */
function cardClass({ depth, flight, dragging, drag }: Pick<SwipeCardProps, 'depth' | 'flight' | 'dragging' | 'drag'>): string {
  return ['ob-card', drag ? 'is-top' : '', dragging ? 'drag' : '', flight ? `fly-${flight}` : '', depth > SWIPE.FAR_DEPTH ? 'far' : ''].filter(Boolean).join(' ');
}

/** One photo card of the deck: a real photo, the name, the CHOOSE/SKIP labels (the strength follows the `--dx` offset by CSS). */
export function SwipeCard({ place, depth, flight, dragging, cardRef, drag }: SwipeCardProps) {
  return (
    <figure ref={cardRef} className={cardClass({ depth, flight, dragging, drag })} style={cssVars({ k: Math.max(0, depth) })} {...(drag ?? {})}>
      <img src={onboardPhotoUrl(place)} alt="" draggable={false} decoding="async" />
      <span className="ob-stamp pick">{T.chooseStamp}</span>
      <span className="ob-stamp skip">{T.skipStamp}</span>
      <figcaption>
        <b>{place.name}</b>
        <small>{fill(T.swipe.category, { category: place.categoryName })}</small>
      </figcaption>
    </figure>
  );
}
