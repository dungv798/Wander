import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { BottomSheet } from './BottomSheet.ts';
import type { Snap } from './bottomSheet.const.ts';

/**
 * Gắn tờ kéo ba nấc vào hai phần tử (thân tờ và vùng nắm kéo) khi `enabled`; gỡ khi tắt hoặc rời màn.
 * `onChange` luôn là bản mới nhất (không buộc dựng lại tờ khi hàm gọi lại đổi).
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
    // chỉ dựng lại khi bật/tắt; nấc khởi tạo chỉ dùng lần đầu
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
}
