import { useEffect, useState } from 'react';
import { MEDIA } from '../../../shared/const/app.const.ts';
import { useMediaQuery } from '../../../shared/hooks/useMediaQuery.ts';
import { HOME } from '../model/home.const.ts';

/** Đổi ảnh nhẹ theo nhịp, dừng khi giảm chuyển động hoặc trỏ/focus vào hero để không làm lệch thao tác. */
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
