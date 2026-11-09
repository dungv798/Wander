import { useRef } from 'react';
import type { PointerEvent, MouseEvent } from 'react';
import { SHEET_DRAG } from '../model/shellMap.const.ts';
import { clampDragOffset, decideSheetMode, isTap } from '../model/sheetDrag.ts';
import type { SheetDragMode } from '../model/sheetDrag.ts';

/** Tên biến CSS giữ độ dịch của tờ khi đang kéo (px); \`shell.css\` dùng nó để dịch tờ và tay nắm theo ngón tay. */
const DRAG_VAR = '--sheet-drag-y';
/** Thuộc tính trên \`.app\` bật khi đang kéo (CSS tắt hoạt họa để tờ bám sát ngón tay). */
const DRAGGING_ATTR = 'data-dragging';

/** Trạng thái một lần kéo đang diễn ra. */
interface DragState {
  readonly startX: number;
  readonly startY: number;
  readonly startedAt: number;
  readonly app: HTMLElement;
  readonly travel: number;
  moved: boolean;
}

/** Bộ xử lý sự kiện cho tay nắm của tờ. */
export interface SheetDragHandlers {
  readonly onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  readonly onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  readonly onPointerUp: (event: PointerEvent<HTMLElement>) => void;
  readonly onPointerCancel: (event: PointerEvent<HTMLElement>) => void;
  /** Chặn lần "click" do trình duyệt sinh ngay sau một lần kéo, để kéo không bị tính là bấm đổi trạng thái. */
  readonly onClickCapture: (event: MouseEvent<HTMLElement>) => void;
}

/** Đo quãng đường giữa hai trạng thái của tờ (px): từ vị trí mở tới vị trí thu (\`--shell-peek-height\` tính từ đáy khung). */
function measureTravel(app: HTMLElement, mode: SheetDragMode, openTop: { current: number | null }): number {
  const height = window.innerHeight;
  const screen = app.querySelector<HTMLElement>('#screen');
  if (mode === 'open' && screen) openTop.current = screen.getBoundingClientRect().top;
  const peekHeight = parseFloat(getComputedStyle(app).getPropertyValue('--shell-peek-height')) || 0;
  return Math.max(1, height - peekHeight - (openTop.current ?? height * SHEET_DRAG.FALLBACK_OPEN_TOP_FRACTION));
}

/** Gỡ độ dịch và cờ kéo khỏi khung ứng dụng (tờ trượt về/đến vị trí cuối nhờ hoạt họa CSS). */
function clearDragVisuals(app: HTMLElement): void {
  app.style.removeProperty(DRAG_VAR);
  app.removeAttribute(DRAGGING_ATTR);
}

/**
 * Kéo tờ nội dung ở điện thoại bằng tay nắm: kéo xuống để thu (xem bản đồ rộng hơn), kéo lên để mở lại; tờ bám theo ngón tay và
 * chuyển trạng thái khi thả nếu đủ xa hoặc đủ nhanh. Bấm (không kéo) vẫn do \`onClick\` của nút xử lý.
 */
export function useSheetDrag(mode: SheetDragMode, setMode: (mode: SheetDragMode) => void): SheetDragHandlers {
  const drag = useRef<DragState | null>(null);
  const openTop = useRef<number | null>(null);
  const swallowClick = useRef(false);
  return {
    /** Bắt đầu một lần kéo: ghi vị trí đầu, đo quãng đường giữa hai trạng thái và giữ con trỏ trên tay nắm. */
    onPointerDown(event) {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      const app = event.currentTarget.closest<HTMLElement>('.app');
      if (!app) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      drag.current = { startX: event.clientX, startY: event.clientY, startedAt: event.timeStamp, app, travel: measureTravel(app, mode, openTop), moved: false };
    },
    /** Đang kéo: vượt ngưỡng bấm thì bật cờ kéo và dịch tờ theo ngón tay (bị chặn trong quãng đường hợp lệ). */
    onPointerMove(event) {
      const state = drag.current;
      if (!state) return;
      const dx = event.clientX - state.startX;
      const dy = event.clientY - state.startY;
      if (!state.moved && isTap(dx, dy)) return;
      state.moved = true;
      state.app.setAttribute(DRAGGING_ATTR, '');
      state.app.style.setProperty(DRAG_VAR, `${clampDragOffset(mode, dy, state.travel)}px`);
    },
    /** Thả tay: gỡ hiệu ứng kéo; nếu đã kéo thì chuyển trạng thái khi đủ xa/đủ nhanh và nuốt lần click kèm theo. */
    onPointerUp(event) {
      const state = drag.current;
      drag.current = null;
      if (!state) return;
      clearDragVisuals(state.app);
      if (!state.moved) return;
      swallowClick.current = true;
      window.setTimeout(() => { swallowClick.current = false; }, 0); // nếu trình duyệt không sinh click thì không giữ cờ cho lần bấm sau
      const next = decideSheetMode(mode, event.clientY - state.startY, event.timeStamp - state.startedAt, state.travel);
      if (next !== mode) setMode(next);
    },
    /** Hệ thống hủy cử chỉ (ví dụ cuộn): bỏ lần kéo, tờ trượt về chỗ cũ. */
    onPointerCancel() {
      const state = drag.current;
      drag.current = null;
      if (state) clearDragVisuals(state.app);
    },
    /** Nuốt lần click sinh ngay sau một lần kéo để kéo không bị tính là bấm đổi trạng thái. */
    onClickCapture(event) {
      if (!swallowClick.current) return;
      swallowClick.current = false;
      event.preventDefault();
      event.stopPropagation();
    },
  };
}
