import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { BottomSheet } from './BottomSheet.ts';
import type { Snap } from './bottomSheet.const.ts';

/**
 * Attaches the three-step draggable sheet to two elements (the sheet body and the drag handle area) when `enabled`; removes it when turned off or on leaving the screen.
 * `onChange` is always the latest copy (it does not force rebuilding the sheet when the callback changes).
 */
export function useBottomSheet(sheetRef: RefObject<HTMLElement | null>, handleRef: RefObject<HTMLElement | null>, enabled: boolean, initial: Snap, onChange: (snap: Snap, visiblePx: number) => void): void {
  const cb = useRef(onChange);
  useEffect(() => {
    cb.current = onChange;
  });
  useEffect(() => {
    const el = sheetRef.current;
    const handle = handleRef.current;
    if (!enabled || !el || !handle) return undefined;
    const sheet = new BottomSheet(el, handle, { initial, onChange: (s, v) => cb.current(s, v) });
    return () => sheet.destroy();
    // rebuilds only on on/off; the initial step is used only the first time
    // eslint-disable-next-line react-hooks/exhaustive-deps -- The two refs keep the elements; initial is used only at build time, onChange is always taken through cb.
  }, [enabled]);
}
