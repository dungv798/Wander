import type { TouchMark } from '../model/swipeDemo.ts';

/** The illustrative touch dot (a white ring + a dot), shown only when the story is 'pressing' in place of the viewer; decorative so it is hidden from screen readers. */
export function TouchDot({ mark }: { readonly mark: TouchMark | null }) {
  if (!mark) return null;
  return <span className={`ob-touch${mark.press ? ' press' : ''}`} style={{ left: mark.x, top: mark.y }} aria-hidden="true" />;
}
