import { useCallback, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { COPY } from '../../../shared/const/copy.vi.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { Sheet } from '../../../shared/ui/Sheet.tsx';
import { useDiscover } from '../hooks/DiscoverProvider.tsx';
import { usePlaceSheet } from '../hooks/PlaceSheetProvider.tsx';
import type { DestinationDetail } from '../model/Catalog.types.ts';
import { placeById } from '../model/destinationQueries.ts';
import { DEST_COPY } from '../model/dest.copy.ts';
import { DISCOVER_COPY } from '../model/discover.copy.ts';
import { OsmLink } from './place/PlaceBody.tsx';
import { PlaceHead } from './place/PlaceHead.tsx';
import { PlaceMedia } from './place/PlaceMedia.tsx';
import { PlaceInformation } from './place/PlaceInformation.tsx';
import { PlaceTripAction } from './place/PlaceTripAction.tsx';
import '../place.css';

/** The detail content of one place, practical information first: the photo, about this place, the facts, what is there, part of day/season/tip (collapsed), the route, then the editorial opinion, the rating and the attribution. */
function PlaceContent({ dest, placeId, inDeck }: { readonly dest: DestinationDetail; readonly placeId: string; readonly inDeck: boolean }) {
  const { state, actions } = useDiscover();
  const sheet = usePlaceSheet();
  const goRef = useRef<(delta: number) => void>(() => undefined);
  /** The photo bar registers the photo-switch function so the sheet's left/right keys work. */
  const registerGo = useCallback((go: (delta: number) => void): void => { goRef.current = go; }, []);
  const place = placeById(dest, placeId);
  if (!place) return null;
  const slot = sheet.slot;
  const canDecide = inDeck && !slot?.noDecide && !slot?.cta && !state.decisions[place.id];
  /** Outside the deck (Destination, Selected, map pin) and without a trip-specific action: the 'Select'/'Selected' button toggles like the card in the list. */
  const canToggle = !inDeck && !slot?.noDecide && !slot?.cta;
  const chosen = state.decisions[place.id] === 'like';

  /** Left/right switch the photo while viewing the detail (keyboard users). */
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    if ((e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') || e.altKey || e.ctrlKey || e.metaKey || (e.target as HTMLElement).closest('input, textarea, select, [contenteditable="true"], .tmroot')) return;
    e.preventDefault();
    goRef.current(e.key === 'ArrowRight' ? 1 : -1);
  };
  /** Decides for the place being viewed and then closes (from the button in the detail sheet on the swipe screen). */
  const decide = (d: 'like' | 'skip'): void => {
    actions.decide(place.id, d);
    sheet.close();
  };

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- catches the arrow keys bubbling up from the focused element inside the detail sheet
    <div className="place-content" onKeyDown={onKeyDown}>
      <div className="place-scroll">
        <PlaceHead dest={dest} place={place} onClose={sheet.close} />
        <div className="pd-layout">
          <PlaceMedia place={place} registerGo={registerGo} />
          <PlaceInformation dest={dest} place={place} extra={slot?.extra} mapLink={canToggle} />
        </div>
      </div>
      <div className="cta-bar place-actions">
        <span className="place-action-title">{place.name}</span>
        {canToggle ? null : <OsmLink place={place} />}
        {slot?.cta}
        {canToggle ? (
          <Button kind="ghost" icon={chosen ? 'check' : 'plus'} aria-pressed={chosen} onClick={() => (chosen ? actions.unpick(place.id) : actions.decide(place.id, 'like'))}>
            {chosen ? DEST_COPY.chosen : DISCOVER_COPY.pick}
          </Button>
        ) : null}
        {canToggle ? <PlaceTripAction destId={dest.id} place={place} /> : null}
        {canDecide ? <>
          <Button kind="ghost" icon="x" onClick={() => decide('skip')}>
            {COPY.place.skipThis}
          </Button>
          <Button icon="check" aria-label={COPY.place.pickThis} onClick={() => decide('like')}>
            {DISCOVER_COPY.pick}
          </Button>
        </> : null}
      </div>
    </div>
  );
}

/** The place detail sheet shared by every discovery screen; on a wide computer's swipe screen it is the right-hand drawer. */
export function PlaceSheet({ dest, inDeck }: { readonly dest: DestinationDetail; readonly inDeck: boolean }) {
  const { placeId, close } = usePlaceSheet();
  if (!placeId) return null;
  const place = placeById(dest, placeId);
  if (!place) return null;
  return (
    <Sheet label={place?.name ?? COPY.place.about} onClose={close}>
      <PlaceContent key={placeId} dest={dest} placeId={placeId} inDeck={inDeck} />
    </Sheet>
  );
}
