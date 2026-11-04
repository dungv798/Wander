import { HALF } from '../../../shared/const/math.const.ts';
import type { Run } from '../../../shared/lib/RunScope.ts';
import { SWIPE } from './onboarding.const.ts';
import { ONBOARD_COPY as T } from './onboarding.copy.ts';
import type { SwipeKind } from './swipeDeck.ts';

/** Nút ✕/✓ đang được nhấn sáng ("both" = cả hai, dùng khi gợi ý hai nút tương đương). */
export type LitButton = SwipeKind | 'both' | null;

/** Vùng đang cần người xem nhìn vào: thẻ đang quẹt, khay "đã chọn" (số tăng), hai nút ✕/✓; null = không nhấn mạnh gì. Phần còn lại mờ nhẹ để mắt đi đúng chỗ. */
export type SwipeFocus = 'card' | 'tray' | 'buttons' | null;

/** Dấu chạm minh họa trên sân khấu (px); `press` = đang nhấn giữ. */
export interface TouchMark {
  readonly x: number;
  readonly y: number;
  readonly press: boolean;
}

/** Chú thích nổi trên bộ thẻ: nội dung và chiều mũi tên. */
export interface Caption {
  readonly text: string;
  readonly dir: 'l' | 'r' | null;
}

/** Cầu nối từ kịch bản demo sang giao diện: kịch bản chỉ gọi các hàm này, không biết gì về React. */
export interface DemoApi {
  /** Thẻ trên cùng (phần tử DOM) và khung sân khấu, cùng hệ tọa độ màn hình. */
  readonly card: () => HTMLElement | null;
  readonly stage: () => DOMRect | null;
  readonly caption: (caption: Caption | null) => void;
  readonly lit: (button: LitButton) => void;
  readonly touch: (mark: TouchMark | null) => void;
  /** Bật/tắt chế độ kéo của thẻ trên cùng (tắt = thẻ được phép bay đi bằng chuyển động). */
  readonly drag: (on: boolean) => void;
  readonly commit: (kind: SwipeKind) => void;
  readonly focus: (area: SwipeFocus) => void;
}

/** Một lượt quẹt mẫu: dấu chạm đặt lên thẻ, kéo chậm theo hướng, giữ, rồi nhả để thẻ bay đi. */
export async function swipeOnce(run: Run, api: DemoApi, kind: SwipeKind): Promise<void> {
  const card = api.card();
  const stage = api.stage();
  if (!card || !stage) return;
  const dir = kind === 'pick' ? 1 : -1;
  const box = card.getBoundingClientRect();
  const fx = box.left - stage.left + box.width / HALF;
  const fy = box.top - stage.top + box.height * SWIPE.FINGER_Y_RATIO;
  api.caption({ text: dir > 0 ? T.swipe.caption.toRight : T.swipe.caption.toLeft, dir: dir > 0 ? 'r' : 'l' });
  api.focus('card');
  api.touch({ x: fx, y: fy, press: false });
  await run.wait(SWIPE.FINGER_IN_MS);
  api.touch({ x: fx, y: fy, press: true });
  await run.wait(SWIPE.PRESS_MS);
  api.drag(true);
  await run.tween(SWIPE.DRAG_MS, (e) => {
    const dx = dir * SWIPE.DRAG_PX * e;
    card.style.setProperty('--dx', String(dx));
    card.style.setProperty('--dy', String(SWIPE.DRAG_DY_PX * e));
    api.touch({ x: fx + dx, y: fy + SWIPE.DRAG_DY_PX * e, press: true });
    api.lit(e > SWIPE.LIT_AT ? kind : null);
  });
  await run.wait(SWIPE.HOLD_MS);
  api.touch(null);
  api.caption({ text: dir > 0 ? T.swipe.caption.pickedRelease : T.swipe.caption.skippedRelease, dir: dir > 0 ? 'r' : 'l' });
  await run.wait(SWIPE.RELEASE_MS);
  api.drag(false);
  api.commit(kind);
  api.focus(kind === 'pick' ? 'tray' : 'card');
  await run.wait(SWIPE.AFTER_FLY_MS);
  api.lit(null);
}

/** Demo một lượt: giới thiệu, chọn thẻ 1, bỏ qua thẻ 2, nhắc hai nút ✕/✓ cùng tác dụng. Kết thúc bằng thẻ 3 đứng yên cho người xem thử. */
export async function playSwipeDemo(run: Run, api: DemoApi): Promise<void> {
  api.caption({ text: T.swipe.caption.intro, dir: null });
  await run.wait(SWIPE.INTRO_MS);
  await swipeOnce(run, api, 'pick');
  await swipeOnce(run, api, 'skip');
  api.caption({ text: T.swipe.caption.buttons, dir: null });
  api.lit('both');
  api.focus('buttons');
  await run.wait(SWIPE.BUTTONS_HINT_MS);
  api.lit(null);
  api.focus(null);
}
