import { useCallback, useEffect, useState } from 'react';
import { COPY, fill } from '../../../../shared/const/copy.vi.ts';
import { safeHttpUrl, safeLinkUrl } from '../../../../shared/lib/safeUrl.ts';
import { Icon } from '../../../../shared/ui/Icon.tsx';
import { IconButton } from '../../../../shared/ui/IconButton.tsx';
import { RevealImage } from '../../../../shared/ui/RevealImage.tsx';
import { usePlaceSheet } from '../../hooks/PlaceSheetProvider.tsx';
import type { PhotoView, PlaceView } from '../../model/Catalog.types.ts';
import { PlacePlaceholder } from '../PlacePlaceholder.tsx';
import { QuickFacts } from './PlaceBody.tsx';

/** The photo orientation decides the layout: portrait next to the facts, landscape above them. */
type Orientation = 'portrait' | 'landscape';

/** Lets the parent screen attach the left/right keys to the right photo bar. */
interface PlaceMediaProps {
  readonly place: PlaceView;
  readonly registerGo: (go: (delta: number) => void) => void;
}

/** The orientation by the real size of the loaded photo; square counts as landscape. */
function orientationOf(image: HTMLImageElement): Orientation {
  return image.naturalHeight > image.naturalWidth ? 'portrait' : 'landscape';
}

/** Moves the photo being opened (from a tapped card/pin) to the front of the list, keeping the rest of the order. */
function orderedPhotos(place: PlaceView, opening: string | null): PhotoView[] {
  const photos = [...place.photos];
  const start = photos.findIndex((photo) => photo.url === opening);
  if (start > 0) photos.unshift(...photos.splice(start, 1));
  return photos;
}

/**
 * One photo at EXACTLY its original ratio (no crop, no letterbox, no blurred background filling the gap): a neutral placeholder frame until the photo is ready.
 * Reports the photo orientation upward once the size is known; a failed photo shows a 'could not load' line with a retry button instead of a broken frame.
 */
function PhotoFrame({ photo, name, onOrientation, onVisible }: { readonly photo: PhotoView; readonly name: string; readonly onOrientation: (o: Orientation) => void; readonly onVisible: (source: string) => void }) {
  const [failedFor, setFailedFor] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  if (failedFor === photo.url) {
    return (
      <div className="pd-photo-failed" role="alert">
        <Icon name="alert-triangle" />
        <span>{COPY.place.photoFailed}</span>
        <button className="btn ghost" type="button" onClick={() => { setFailedFor(null); setAttempt((value) => value + 1); }}>{COPY.common.retry}</button>
      </div>
    );
  }
  return <RevealImage key={attempt} src={photo.url} alt={name} decoding="async" transitionFit="contain" onVisible={onVisible} onSourceError={() => setFailedFor(photo.url)} onLoad={event => onOrientation(orientationOf(event.currentTarget))} />;
}

/** The attribution line of the photo being viewed (author, license, source): required by the license so it always shows under the photo. */
function PhotoCredit({ photo }: { readonly photo: PhotoView }) {
  return (
    <p className="pd-credit">
      {photo.caption ? <span className="pd-photo-caption">{photo.caption}</span> : null}
      {photo.authorUrl ? <a href={safeHttpUrl(photo.authorUrl)} target="_blank" rel="noopener noreferrer">{fill(COPY.place.photoCreditShort, { author: photo.author || COPY.place.unknownAuthor, license: photo.license })}</a> : fill(COPY.place.photoCreditShort, { author: photo.author || COPY.place.unknownAuthor, license: photo.license })}
      {' · '}
      <a href={safeHttpUrl(photo.sourceUrl)} target="_blank" rel="noopener noreferrer">{COPY.place.sourceLink}</a>
    </p>
  );
}

/**
 * The photo part of the detail sheet, one template for every place: the main photo at its original ratio, a light bar (View original, previous/next, ordinal number), and 4 facts.
 * A portrait photo goes NEXT TO the facts; a landscape photo goes ABOVE the facts. With no photo a placeholder with the real kind name is used. The left/right keys are passed by the parent screen through `registerGo`.
 */
export function PlaceMedia({ place, registerGo }: PlaceMediaProps) {
  const { openingPhoto } = usePlaceSheet();
  const photos = orderedPhotos(place, openingPhoto);
  const [index, setIndex] = useState(0);
  const [orientation, setOrientation] = useState<Orientation>('landscape');
  const count = photos.length;
  const current = photos[index];
  const [shownSource, setShownSource] = useState(current?.url);
  const shown = photos.find(photo => photo.url === shownSource) ?? current;
  /** Goes to the adjacent photo (delta +/-1); stops at the first/last. */
  const go = useCallback((delta: number): void => {
    setIndex((value) => Math.max(0, Math.min(count - 1, value + delta)));
  }, [count, setIndex]);
  useEffect(() => {
    registerGo(go);
  }, [go, registerGo]);
  return (
    <div className="pd-media" data-orient={current ? orientation : 'landscape'}>
      <div className="pd-photo-col">
        <div className="pd-photo" aria-label={fill(COPY.place.photosOf, { name: place.name })}>
          {current ? <PhotoFrame photo={current} name={place.name} onOrientation={setOrientation} onVisible={setShownSource} /> : <PlacePlaceholder place={place} />}
          {shown ? <a className="btn ghost pd-original" href={safeLinkUrl(shown.url)} target="_blank" rel="noopener noreferrer">{COPY.place.sourceOriginal}</a> : null}
        </div>
        {current ? (
          <>
            <div className="pd-bar">
              {count > 1 ? (
                <div className="pd-pager">
                  <IconButton className="pd-nav pd-prev" icon="chevron-left" label={COPY.place.prevPhoto} disabled={index === 0} onClick={() => go(-1)} />
                  <span className="pd-count" aria-live="polite">{`${index + 1} / ${count}`}</span>
                  <IconButton className="pd-nav pd-next" icon="chevron-left" flip label={COPY.place.nextPhoto} disabled={index === count - 1} onClick={() => go(1)} />
                </div>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
      <QuickFacts place={place} />
      {shown ? <PhotoCredit photo={shown} /> : null}
    </div>
  );
}
