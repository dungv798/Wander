import { useCallback, useState } from 'react';
import type { RefObject } from 'react';
import { HALF } from '../../../shared/const/math.const.ts';
import type { PlaceView } from '../../discover/index.ts';
import { SWIPE } from '../model/onboarding.const.ts';

/** A shrunken photo flying from the card just chosen down to the 'selected' tray (coordinates relative to the stage, px). */
export interface FlyingChip {
  readonly id: number;
  readonly place: PlaceView;
  readonly fx: number;
  readonly fy: number;
  readonly tx: number;
  readonly ty: number;
}

/** The 'selected' tray: the photos that have landed and the photos in flight. */
export interface SelectedTray {
  readonly thumbs: readonly PlaceView[];
  readonly chips: readonly FlyingChip[];
  /** Makes a place's photo fly from the card frame `from` (screen coordinates) to the next slot of the tray. */
  readonly fly: (place: PlaceView, from: DOMRect) => void;
  /** The photo has finished flying: adds it to the tray (the counter goes up at the same time). */
  readonly land: (id: number) => void;
  readonly clear: () => void;
}

/** Manages the 'selected' tray of the swipe scene; `stage` is the stage element that is the origin of the coordinates. */
export function useSelectedTray(stage: RefObject<HTMLElement | null>): SelectedTray {
  const [thumbs, setThumbs] = useState<readonly PlaceView[]>([]);
  const [chips, setChips] = useState<readonly FlyingChip[]>([]);
  const [seq, setSeq] = useState(0);
  const fly = useCallback(
    /** Computes the start/end points relative to the stage and then adds one flying photo. */
    (place: PlaceView, from: DOMRect) => {
      const box = stage.current?.getBoundingClientRect();
      if (!box) return;
      const slot = SWIPE.THUMB_LEFT_PX + (thumbs.length + chips.length) * SWIPE.THUMB_STEP_PX + SWIPE.THUMB_R_PX;
      const chip: FlyingChip = { id: seq, place, fx: from.left - box.left + from.width / HALF, fy: from.top - box.top + from.height / HALF, tx: slot, ty: box.height - SWIPE.THUMB_BOTTOM_PX - SWIPE.THUMB_R_PX };
      setSeq(seq + 1);
      setChips((list) => [...list, chip]);
    },
    [stage, thumbs.length, chips.length, seq],
  );
  const land = useCallback(
    /** Moves the photo that has finished flying from the flying list to the tray (two separate updates, not nested). */
    (id: number) => {
      const chip = chips.find((c) => c.id === id);
      if (!chip) return;
      setThumbs((t) => [...t, chip.place]);
      setChips((list) => list.filter((c) => c.id !== id));
    },
    [chips],
  );
  const clear = useCallback(() => {
    setThumbs([]);
    setChips([]);
  }, []);
  return { thumbs, chips, fly, land, clear };
}
