import { useEffect, useRef, useState } from 'react';
import { MEDIA, SWIPE } from '../../../shared/const/app.const.ts';
import { useMediaQuery, usePrefersReducedMotion } from '../../../shared/hooks/useMediaQuery.ts';
import { useScreenFlag, useScreenVar } from '../../../shared/ui/ScreenHost.tsx';
import type { AddingMode } from '../model/addingMode.ts';
import type { DestinationDetail } from '../model/Catalog.types.ts';
import { photoAt } from '../model/destinationQueries.ts';
import { remainingIds } from '../model/discoverState.ts';
import { fling, flushFling } from '../model/swipeGesture.ts';
import type { SwipeDir } from '../model/swipeGesture.ts';
import { useDiscover } from './DiscoverProvider.tsx';
import { usePlaceSheet } from './PlaceSheetProvider.tsx';
import type { PlaceSlot } from './PlaceSheetProvider.tsx';
import { useSwipeDrag } from './useSwipeDrag.ts';
import { matchesDiscoveryFilter } from '../model/discoveryFilters.ts';
import { usePublishDeckSpotlight } from './DeckSpotlightProvider.tsx';

/** Tờ chi tiết ở chế độ thêm vào chuyến: không có nút chọn/bỏ qua riêng (bộ thẻ đã có). */
const NO_DECIDE: PlaceSlot = { noDecide: true };

/** Phím tắt của bộ thẻ: ←/→ bỏ qua/chọn, ↑ chi tiết, Backspace hoặc Z hoàn tác. Bỏ qua khi đang mở chi tiết hoặc đang gõ. */
function useDeckKeys(swipeTop: (dir: SwipeDir) => void, openFront: () => void, undo: () => void): void {
  const sheet = usePlaceSheet();
  useEffect(() => {
    /** Xử lý một lần nhấn phím. */
    const onKey = (e: KeyboardEvent): void => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.defaultPrevented || sheet.placeId || (e.target as HTMLElement).closest('input, textarea, select')) return;
      if (e.key === 'ArrowRight') swipeTop('r');
      else if (e.key === 'ArrowLeft') swipeTop('l');
      else if (e.key === 'ArrowUp') openFront();
      else if (e.key === 'Backspace' || e.key.toLowerCase() === 'z') undo();
      else return;
      e.preventDefault();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });
}

/** Tải trước ảnh của vài thẻ kế tiếp để thẻ mới hiện ra không khựng vì chờ giải mã ảnh. */
function usePreloadPhotos(urls: readonly (string | undefined)[]): void {
  const key = urls.join('|');
  useEffect(() => {
    for (const url of key.split('|')) if (url) new Image().src = url;
  }, [key]);
}

/**
 * Điều khiển bộ thẻ quẹt: thẻ còn lại, thẻ trên cùng, cử chỉ kéo, bay thẻ bằng nút/phím, ảnh nền mờ và ngăn kéo chi tiết
 * bám theo thẻ trên cùng ở màn ≥ 1280 px.
 */
export function useDeck(dest: DestinationDetail, adding?: AddingMode) {
  const { state, actions } = useDiscover();
  const sheet = usePlaceSheet();
  const reduced = usePrefersReducedMotion();
  const drawerOk = useMediaQuery(MEDIA.DRAWER);
  const deckRef = useRef<HTMLDivElement | null>(null);
  const [skippedHere, setSkippedHere] = useState<readonly string[]>([]);
  const left = adding
    ? dest.places.filter((p) => matchesDiscoveryFilter(p, state.cat) && !adding.excludeIds.includes(p.id) && !skippedHere.includes(p.id))
    : remainingIds(state, dest.places);
  const front = left[0];
  usePublishDeckSpotlight(dest.id, front?.id ?? null);
  const frontPhoto = front ? photoAt(front, state.photo[front.id] ?? 0)?.url : undefined;

  useScreenFlag('immersive', Boolean(front));
  usePreloadPhotos(left.slice(SWIPE.VISIBLE_CARDS, SWIPE.VISIBLE_CARDS + SWIPE.PRELOAD_CARDS).map((p) => photoAt(p, 0)?.url));
  useScreenVar('stage', frontPhoto ? `url("${encodeURI(frontPhoto)}")` : null);

  /** Quyết định cho thẻ trên cùng theo hướng quẹt (phải = thích). */
  const decideFront = (dir: SwipeDir): void => {
    if (!front) return;
    if (!adding) actions.decide(front.id, dir === 'r' ? 'like' : 'skip');
    else if (dir === 'r') adding.onAdd({ id: front.id, category: front.category });
    else setSkippedHere((ids) => [...ids, front.id]);
  };
  /** Bay thẻ trên cùng rồi quyết định (dùng cho nút và phím). */
  const swipeTop = (dir: SwipeDir): void => {
    const card = deckRef.current?.querySelector<HTMLElement>('.card.front');
    if (card) fling(card, dir, reduced, () => decideFront(dir));
  };
  /** Mở chi tiết thẻ trên cùng. */
  const openFront = (): void => {
    if (front) sheet.open(front.id, adding ? NO_DECIDE : undefined);
  };

  const handlers = useSwipeDrag({
    onDecide: decideFront,
    onShiftPhoto: (delta) => {
      if (!front) return;
      actions.setPhoto(front.id, Math.max(0, Math.min(front.photos.length - 1, (state.photo[front.id] ?? 0) + delta)));
    },
    onTap: openFront,
    multiPhoto: (front?.photos.length ?? 0) > 1,
  });
  /** Hoàn tác thẻ cuối, trừ khi một thẻ đang bay (tránh ghi quyết định cho thẻ đã được hoàn tác). */
  const undo = (): void => {
    if (!adding && !deckRef.current?.querySelector('[data-gone]')) actions.undo();
  };
  useDeckKeys(swipeTop, openFront, undo);
  const hasDeck = Boolean(front);
  useEffect(() => {
    const deck = deckRef.current;
    return () => flushFling(deck);
  }, [hasDeck]);

  useEffect(() => {
    if (drawerOk && sheet.placeId) {
      queueMicrotask(() => {
        if (front) sheet.open(front.id, adding ? NO_DECIDE : undefined);
        else sheet.close();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ đồng bộ khi thẻ trên cùng đổi
  }, [front?.id]);

  return { state, actions, left, front, deckRef, handlers, swipeTop, openFront, undo };
}
