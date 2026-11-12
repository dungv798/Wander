import { useLayoutEffect } from 'react';
import type { RefObject } from 'react';
import { HALF } from '../../../shared/const/math.const.ts';
import { MORPH_MS } from '../model/onboarding.const.ts';

const OLD_CARD = '.ob-layer.out .ob-fan:first-of-type, .ob-layer.out .ob-card.is-top';
const NEW_CARD = '.ob-layer.enter .ob-fan:first-of-type, .ob-layer.enter .ob-card.is-top';
const HALF_TURN_DEG = 180;
const CAPTION_DELAY_MS = 120;
const EASE = 'cubic-bezier(.22, 1, .36, 1)';

/** The rotation angle (degrees) and the scale of a transform matrix. */
function rotation(m: DOMMatrix): number {
  return (Math.atan2(m.b, m.a) * HALF_TURN_DEG) / Math.PI;
}

/** The scale of a transform matrix. */
function scaling(m: DOMMatrix): number {
  return Math.hypot(m.a, m.b);
}

/** The center of an element in screen coordinates (unchanged when the element rotates around its center). */
function centerOf(el: HTMLElement): { x: number; y: number } {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / HALF, y: r.top + r.height / HALF };
}

/** Makes the new card 'fly' from exactly the position, rotation angle and size of the old card to its own place (using the separate translate/rotate/scale properties so the card's transform is not touched); the old card hides at once because it is the same photo. */
function morph(from: HTMLElement, to: HTMLElement): void {
  const a = centerOf(from);
  const b = centerOf(to);
  const mf = new DOMMatrix(getComputedStyle(from).transform);
  const mt = new DOMMatrix(getComputedStyle(to).transform);
  to.animate(
    [
      { translate: `${a.x - b.x}px ${a.y - b.y}px`, rotate: `${rotation(mf) - rotation(mt)}deg`, scale: String(scaling(mf) / scaling(mt)) },
      { translate: '0px 0px', rotate: '0deg', scale: '1' },
    ],
    { duration: MORPH_MS, easing: EASE },
  );
  to.querySelector('figcaption')?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: MORPH_MS, delay: CAPTION_DELAY_MS, fill: 'backwards' });
  from.style.visibility = 'hidden';
}

/**
 * The 'same card' scene transition: when two adjacent scenes have a card with the same photo (the Da Lat card in scene 1 and the first card of the deck in scene 2), the new card moves smoothly from the old card's position
 * while the rest fades, so the viewer sees it as one continuous object. If the card is not found or the photo differs it is skipped (the scene still fades normally).
 * `token` changes on every scene change to re-run.
 */
export function useCardMorph(stage: RefObject<HTMLElement | null>, enabled: boolean, token: string): void {
  useLayoutEffect(() => {
    if (!enabled) return;
    const root = stage.current;
    const from = root?.querySelector<HTMLElement>(OLD_CARD);
    const to = root?.querySelector<HTMLElement>(NEW_CARD);
    const same = from && to && from.querySelector('img')?.getAttribute('src') === to.querySelector('img')?.getAttribute('src');
    if (from && to && same) morph(from, to);
  }, [stage, enabled, token]);
}
