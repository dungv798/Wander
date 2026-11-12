import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useRoute } from '../../../shared/router/hashRoute.ts';
import { isOverlayEntry, withOverlay } from '../../../shared/router/overlayHistory.ts';
import { galleryPhotoOrigin, photoOrigin, transitionPhoto } from '../../../shared/ui/photoTransition.ts';
import type { PhotoOrigin } from '../../../shared/ui/photoTransition.ts';

/**
 * Extra content of the detail sheet supplied by the calling screen (for example a trip: the item summary + a 'Choose day' button). The discover feature
 * knows nothing about trips; it only shows the buttons supplied by where it was opened.
 */
export interface PlaceSlot {
  /** The native pin photo frame supplied by the map screen, without changing the map renderer. */
  readonly photoOrigin?: PhotoOrigin | null;
  /** Shown right under the place name. */
  readonly extra?: ReactNode;
  /** The button bar at the bottom of the sheet; replaces the default 'Skip/Choose this place'. */
  readonly cta?: ReactNode;
  /** Turns off the default 'Skip/Choose this place' pair of buttons (for example when adding to a trip, the deck has its own buttons). */
  readonly noDecide?: boolean;
}

interface PlaceSheetApi {
  readonly openingPhoto: string | null;
  /** The id of the place open in the detail sheet; null = closed. */
  readonly placeId: string | null;
  readonly slot: PlaceSlot | null;
  /** Opens (or switches to) the detail of a place, optionally with extra content. */
  readonly open: (id: string, slot?: PlaceSlot) => void;
  /** Closes the detail sheet. */
  readonly close: () => void;
}

const PlaceSheetContext = createContext<PlaceSheetApi | null>(null);

/** Keeps the state 'which place's detail is being viewed' so every screen (home, swipe, selected, trips) opens the same sheet. The sheet belongs to the screen that opened it. */
export function PlaceSheetProvider({ children }: { readonly children: ReactNode }) {
  const route = useRoute();
  const routeKey = `${route.view}|${route.id ?? ''}|${route.sub ?? ''}`;
  const [opened, setOpened] = useState<{ id: string; key: string; photo: string | null; slot: PlaceSlot | null } | null>(null);
  const closing = useRef(false);
  const origin = useRef<PhotoOrigin | null>(null);
  /** Closes through the same path for Esc, the Close button and Back, keeping the Sheet's focus cleanup. */
  const dismiss = useCallback((): void => {
    const from = galleryPhotoOrigin();
    transitionPhoto(from, () => setOpened(null), () => {
      const saved = origin.current;
      return saved?.element?.isConnected ? { ...saved, rect: saved.element.getBoundingClientRect() } : saved;
    });
  }, []);
  useEffect(() => {
    /** Back closes the overlay sheet on the same URL before the user leaves the background screen. */
    const popped = (): void => { closing.current = false; dismiss(); };
    window.addEventListener('popstate', popped);
    return () => window.removeEventListener('popstate', popped);
  }, [dismiss]);
  if (opened && opened.key !== routeKey) setOpened(null); // forgotten entirely when the screen is left, so coming back does not re-open it by itself
  const placeId = opened && opened.key === routeKey ? opened.id : null;
  const open = useCallback(
    /** Opens the place detail by id, tied to the current screen. */
    (id: string, slot?: PlaceSlot) => {
      closing.current = false;
      if (!isOverlayEntry(history.state, location.hash)) history.pushState(withOverlay(history.state, location.hash), '');
      const escaped = CSS.escape(id);
      const image = document.querySelector<HTMLImageElement>(`.card.front[data-id="${escaped}"] img, [data-place-photo="${escaped}"] img`);
      origin.current = slot?.photoOrigin ?? photoOrigin(image);
      const photo = origin.current?.url ?? null;
      transitionPhoto(origin.current, () => setOpened({ id, key: routeKey, photo, slot: slot ?? null }), galleryPhotoOrigin);
    },
    [routeKey],
  );
  const close = useCallback(
    /** Closes the detail. */
    () => {
      if (closing.current) return;
      if (isOverlayEntry(history.state, location.hash)) { closing.current = true; history.back(); }
      else dismiss();
    },
    [dismiss],
  );
  const value = useMemo(() => ({ placeId, openingPhoto: opened?.photo ?? null, slot: opened?.slot ?? null, open, close }), [placeId, opened, open, close]);
  return <PlaceSheetContext.Provider value={value}>{children}</PlaceSheetContext.Provider>;
}

/** Access to the place detail sheet; throws if `PlaceSheetProvider` was forgotten. */
export function usePlaceSheet(): PlaceSheetApi {
  const ctx = useContext(PlaceSheetContext);
  if (!ctx) throw new Error('usePlaceSheet phải nằm trong PlaceSheetProvider');
  return ctx;
}
