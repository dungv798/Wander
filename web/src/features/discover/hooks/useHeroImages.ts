import { useEffect, useState } from 'react';
import { MEDIA } from '../../../shared/const/app.const.ts';
import { useMediaQuery } from '../../../shared/hooks/useMediaQuery.ts';
import { HOME } from '../model/home.const.ts';

/** Changes the photo gently on a rhythm, stops under reduced motion or when the pointer/focus is on the hero so it does not disturb the action. */
export function useHeroImages(count: number) {
  const reduced = useMediaQuery(MEDIA.REDUCED_MOTION);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (reduced || paused || count <= 1) return;
    const timer = window.setInterval(() => setIndex(i => (i + 1) % count), HOME.ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [count, reduced, paused]);
  return { index: reduced ? 0 : index % Math.max(1, count), setPaused };
}
