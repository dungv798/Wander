import { SWIPE } from '../../../shared/const/app.const.ts';
import { MOTION } from '../../../shared/ui/motion.const.ts';

/** The swipe direction: right = choose, left = skip. */
export type SwipeDir = 'r' | 'l';

const STAMP_R = '.stamp.r';
const STAMP_L = '.stamp.l';
const PROGRESS_VAR = '--p';
const GONE_FLAG = 'gone';
/** The pending decisions of cards that have flown away: run exactly once, either when the flight time is over, or earlier when the screen is removed (`flushFling`). */
const PENDING = new WeakMap<HTMLElement, () => void>();

/** Clamps a value to [0, 1]. */
function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

/** Draws the card by the drag amount (translate, tilt), the LIKE/SKIP stamps getting stronger and the progress making the card behind grow (`--p` on the deck). */
export function paintDrag(card: HTMLElement, dx: number, dy: number): void {
  card.style.transform = `translate(${dx}px,${dy * SWIPE.DRAG_Y_FACTOR}px) rotate(${dx / SWIPE.ROTATE_DIVISOR}deg)`;
  const r = card.querySelector<HTMLElement>(STAMP_R);
  const l = card.querySelector<HTMLElement>(STAMP_L);
  if (r) r.style.opacity = String(clamp01(dx / SWIPE.STAMP_FULL_PX));
  if (l) l.style.opacity = String(clamp01(-dx / SWIPE.STAMP_FULL_PX));
  card.parentElement?.style.setProperty(PROGRESS_VAR, String(clamp01(Math.abs(dx) / SWIPE.PROGRESS_FULL_PX)));
}

/** Puts the card back where it was with a smooth motion when the user releases without reaching the threshold. */
export function resetDrag(card: HTMLElement): void {
  card.style.transition = window.matchMedia(MOTION.REDUCED_QUERY).matches ? 'none' : `transform ${MOTION.DURATION_MS}ms ${MOTION.EASING}`;
  card.style.transform = '';
  const r = card.querySelector<HTMLElement>(STAMP_R);
  const l = card.querySelector<HTMLElement>(STAMP_L);
  if (r) r.style.opacity = '0';
  if (l) l.style.opacity = '0';
  card.parentElement?.style.setProperty(PROGRESS_VAR, '0');
}

/** Flies the card off the screen in the swipe direction and then calls `done`; under reduced motion it calls `done` at once. Each card flies only once. */
export function fling(card: HTMLElement, dir: SwipeDir, reduced: boolean, done: () => void): void {
  if (card.dataset[GONE_FLAG]) return;
  card.dataset[GONE_FLAG] = '1';
  let fired = false;
  /** Runs `done` exactly once whether it is called from the timer or from `flushFling`. */
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

/** Runs at once the decisions of the card that is flying inside `root` (called when the screen is removed so the choice the user just swiped is not lost, for example pressing 'Save' right after swiping). */
export function flushFling(root: ParentNode | null): void {
  root?.querySelectorAll<HTMLElement>('.card[data-gone]').forEach((card) => PENDING.get(card)?.());
}

/** Whether a release has enough force to count as a swipe: dragged past the threshold, or dragged fast even if short. `velocity` is in px/ms. */
export function shouldCommit(dx: number, velocity: number): boolean {
  return Math.abs(dx) > SWIPE.DISTANCE_PX || (Math.abs(velocity) > SWIPE.FAST_VELOCITY && Math.abs(dx) > SWIPE.FAST_MIN_DISTANCE_PX);
}
