import { HALF } from '../../../shared/const/math.const.ts';
import type { Run } from '../../../shared/lib/RunScope.ts';
import { SWIPE } from './onboarding.const.ts';
import { ONBOARD_COPY as T } from './onboarding.copy.ts';
import type { SwipeKind } from './swipeDeck.ts';

/** The X/check button being lit ('both' = both, used when hinting that the two buttons are equivalent). */
export type LitButton = SwipeKind | 'both' | null;

/** The area the viewer needs to look at: the card being swiped, the 'selected' tray (the number goes up), the two X/check buttons; null = nothing emphasized. The rest dims slightly so the eye goes to the right place. */
export type SwipeFocus = 'card' | 'tray' | 'buttons' | null;

/** The illustrative touch dot on the stage (px); `press` = being held down. */
export interface TouchMark {
  readonly x: number;
  readonly y: number;
  readonly press: boolean;
}

/** The caption floating on the deck: the content and the arrow direction. */
export interface Caption {
  readonly text: string;
  readonly dir: 'l' | 'r' | null;
}

/** The bridge from the demo script to the UI: the script only calls these functions and knows nothing about React. */
export interface DemoApi {
  /** The top card (a DOM element) and the stage frame, in the same screen coordinate system. */
  readonly card: () => HTMLElement | null;
  readonly stage: () => DOMRect | null;
  readonly caption: (caption: Caption | null) => void;
  readonly lit: (button: LitButton) => void;
  readonly touch: (mark: TouchMark | null) => void;
  /** Turns the top card's drag mode on/off (off = the card may fly away by motion). */
  readonly drag: (on: boolean) => void;
  readonly commit: (kind: SwipeKind) => void;
  readonly focus: (area: SwipeFocus) => void;
}

/** One sample swipe: the touch dot is placed on the card, drags slowly in a direction, holds, and then releases so the card flies away. */
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

/** A one-round demo: intro, choose card 1, skip card 2, hint that the two X/check buttons do the same. It ends with card 3 standing still for the viewer to try. */
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
