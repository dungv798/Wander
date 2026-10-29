import { SWIPE } from '../../../shared/const/app.const.ts';
import { MOTION } from '../../../shared/ui/motion.const.ts';

/** Hướng quẹt: phải = chọn, trái = bỏ qua. */
export type SwipeDir = 'r' | 'l';

const STAMP_R = '.stamp.r';
const STAMP_L = '.stamp.l';
const PROGRESS_VAR = '--p';
const GONE_FLAG = 'gone';
/** Quyết định đang chờ của các thẻ đã bay: chạy đúng một lần, hoặc khi hết giờ bay, hoặc sớm hơn khi màn bị gỡ (`flushFling`). */
const PENDING = new WeakMap<HTMLElement, () => void>();

/** Kẹp giá trị vào [0, 1]. */
function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

/** Vẽ thẻ theo độ kéo (dịch, nghiêng), dấu THÍCH/BỎ QUA đậm dần và tiến độ cho thẻ phía sau lớn dần (`--p` trên bộ bài). */
export function paintDrag(card: HTMLElement, dx: number, dy: number): void {
  card.style.transform = `translate(${dx}px,${dy * SWIPE.DRAG_Y_FACTOR}px) rotate(${dx / SWIPE.ROTATE_DIVISOR}deg)`;
  const r = card.querySelector<HTMLElement>(STAMP_R);
  const l = card.querySelector<HTMLElement>(STAMP_L);
  if (r) r.style.opacity = String(clamp01(dx / SWIPE.STAMP_FULL_PX));
  if (l) l.style.opacity = String(clamp01(-dx / SWIPE.STAMP_FULL_PX));
  card.parentElement?.style.setProperty(PROGRESS_VAR, String(clamp01(Math.abs(dx) / SWIPE.PROGRESS_FULL_PX)));
}

/** Đưa thẻ về chỗ cũ có chuyển động mượt khi người dùng thả mà chưa đủ ngưỡng. */
export function resetDrag(card: HTMLElement): void {
  card.style.transition = window.matchMedia(MOTION.REDUCED_QUERY).matches ? 'none' : `transform ${MOTION.DURATION_MS}ms ${MOTION.EASING}`;
  card.style.transform = '';
  const r = card.querySelector<HTMLElement>(STAMP_R);
  const l = card.querySelector<HTMLElement>(STAMP_L);
  if (r) r.style.opacity = '0';
  if (l) l.style.opacity = '0';
  card.parentElement?.style.setProperty(PROGRESS_VAR, '0');
}

/** Bay thẻ ra khỏi màn theo hướng quẹt rồi gọi `done`; giảm chuyển động thì gọi `done` ngay. Mỗi thẻ chỉ bay một lần. */
export function fling(card: HTMLElement, dir: SwipeDir, reduced: boolean, done: () => void): void {
  if (card.dataset[GONE_FLAG]) return;
  card.dataset[GONE_FLAG] = '1';
  let fired = false;
  /** Chạy `done` đúng một lần dù được gọi từ hẹn giờ hay từ `flushFling`. */
  const once = (): void => {
    if (fired) return;
    fired = true;
    PENDING.delete(card);
    done();
  };
  if (reduced) {
    once();
    return;
  }
  PENDING.set(card, once);
  const sign = dir === 'r' ? 1 : -1;
  card.style.transition = `transform ${MOTION.DURATION_MS}ms ${MOTION.EASING}, opacity ${MOTION.DURATION_MS}ms ${MOTION.EASING}`;
  if (dir === 'r') {
    const tick = card.querySelector<HTMLElement>(STAMP_R);
    if (tick) tick.style.opacity = '1';
  }
  card.style.transform = `translate(${sign * SWIPE.FLING_PX}px,${SWIPE.FLING_UP_PX}px) rotate(${sign * SWIPE.FLING_ROTATE_DEG}deg)`;
  card.style.opacity = '0';
  card.parentElement?.style.setProperty(PROGRESS_VAR, '1');
  window.setTimeout(once, MOTION.DURATION_MS);
}

/** Chạy ngay các quyết định của thẻ đang bay trong `root` (gọi khi màn bị gỡ để không mất lượt chọn người dùng vừa quẹt, ví dụ bấm "Lưu" ngay sau khi quẹt). */
export function flushFling(root: ParentNode | null): void {
  root?.querySelectorAll<HTMLElement>('.card[data-gone]').forEach((card) => PENDING.get(card)?.());
}

/** Thả tay có đủ lực để tính là quẹt không: kéo quá ngưỡng, hoặc kéo nhanh dù ngắn. `velocity` tính px/ms. */
export function shouldCommit(dx: number, velocity: number): boolean {
  return Math.abs(dx) > SWIPE.DISTANCE_PX || (Math.abs(velocity) > SWIPE.FAST_VELOCITY && Math.abs(dx) > SWIPE.FAST_MIN_DISTANCE_PX);
}
