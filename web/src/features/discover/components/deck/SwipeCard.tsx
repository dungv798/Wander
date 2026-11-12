import { PlacePlaceholder } from '../PlacePlaceholder.tsx';
import { RevealImage } from '../../../../shared/ui/RevealImage.tsx';
import { useState } from 'react';
import type { PointerEvent } from 'react';
import { COPY } from '../../../../shared/const/copy.vi.ts';
import { Icon } from '../../../../shared/ui/Icon.tsx';
import { useCreditPill } from '../../hooks/useCreditPill.ts';
import { DEST_COPY } from '../../model/dest.copy.ts';
import type { PlaceView } from '../../model/Catalog.types.ts';
import { photoAt } from '../../model/destinationQueries.ts';
import { CreditPill } from '../CreditPill.tsx';

interface FrontHandlers {
  readonly onPointerDown: (e: PointerEvent<HTMLElement>) => void;
  readonly onPointerMove: (e: PointerEvent<HTMLElement>) => void;
  readonly onPointerUp: (e: PointerEvent<HTMLElement>) => void;
  readonly onPointerCancel: (e: PointerEvent<HTMLElement>) => void;
}

interface SwipeCardProps {
  readonly place: PlaceView;
  /** 0 = the top card (swipeable); 1, 2 = the cards behind it. */
  readonly depth: number;
  readonly photoIndex: number;
  /** The drag handler; passed only to the top card. */
  readonly handlers?: FrontHandlers;
  readonly onInfo?: () => void;
  readonly onPhoto?: (delta: number) => void;
}

/** The text floating on the photo (compact so the photo is the star): kind, the photo-source button (top card), name, area with the distance, the good season and the duration. */
function CardInfo({ place }: { readonly place: PlaceView }) {
  return (
    <div className="card-info">
      <div className="card-top">
        <span className="card-kind">{place.id.startsWith('exp-') ? DEST_COPY.experience : place.categoryName} · {place.area}</span>
      </div>
      <h2>{place.name}</h2>
      <p className="card-hook">{place.summary || place.hook}</p>
    </div>
  );
}

/**
 * The full-screen swipe card (v6, PO 26/10/2026): the place's photo is the background; the name, the info and the LIKE/SKIP stamps float over the photo.
 * The top card receives the drag gesture; the cards behind are only decoration (`aria-hidden`).
 */
export function SwipeCard({ place, depth, photoIndex, handlers, onInfo, onPhoto }: SwipeCardProps) {
  const front = depth === 0;
  const credit = useCreditPill(photoIndex);
  const photo = photoAt(place, photoIndex);
  const [shownSource, setShownSource] = useState(photo?.url);
  const shown = place.photos.find(candidate => candidate.url === shownSource) ?? photo;
  return (
    <article
      className={`card cat-${place.category} ${front ? 'front' : `depth-${depth}`}`}
      data-id={place.id}
      aria-label={front ? `${place.name}. ${COPY.deck.cardAria}` : undefined}
      aria-hidden={front ? undefined : true}
      {...(front ? handlers : {})}
    >
      <div className="card-photo">
      {photo ? <RevealImage className="ph" alt="" src={photo.url} onVisible={setShownSource} /> : <PlacePlaceholder place={place} className="ph" />}
      <div className="card-veil" aria-hidden="true" />
      {shown?.caption ? <span className="card-photo-caption">{shown.caption}</span> : null}
      {place.photos.length > 1 ? (
        <div className="segs" aria-hidden="true">
          {place.photos.map((p, k) => (
            <i key={p.url} className={k <= photoIndex ? 'on' : undefined} />
          ))}
        </div>
      ) : null}
      <span className="stamp r" aria-hidden="true">
        <Icon name="check" />
      </span>
      <span className="stamp l" aria-hidden="true">
        <Icon name="x" />
      </span>
      <CardInfo place={place} />
      {front ? <button className="credit-btn" type="button" aria-label={COPY.deck.creditAria} onPointerDown={event => event.stopPropagation()} onClick={credit.toggle}><Icon name="info-circle" /></button> : null}
      {front && place.photos.length > 1 ? <div className="card-photo-controls" onPointerDown={event => event.stopPropagation()}>
        <button type="button" aria-label={COPY.place.prevPhoto} onClick={() => onPhoto?.(-1)}><Icon name="chevron-left" /></button>
        <button type="button" aria-label={COPY.place.nextPhoto} onClick={() => onPhoto?.(1)}><Icon name="chevron-left" className="flip" /></button>
      </div> : null}
      {front && credit.open ? <CreditPill photo={shown} /> : null}
      </div>
      {front ? <button className="card-detail" type="button" aria-label={COPY.deck.infoAria} onPointerDown={event => event.stopPropagation()} onClick={onInfo}><Icon name="compass" size="s" />{DEST_COPY.detail}<Icon name="chevron-up" size="s" /></button> : null}
    </article>
  );
}
