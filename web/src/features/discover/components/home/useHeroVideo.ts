import { useEffect, useRef, useState } from 'react';
import { HERO_VIDEO } from '../../model/heroVideo.const.ts';
import { canShowHeroVideo } from '../../model/heroVideo.ts';

type Connection = EventTarget & { saveData?: boolean };

/** Đợi trang tải xong, hero nhìn thấy và trình duyệt rảnh; thay đổi tùy chọn lập tức trả về ảnh. */
export function useHeroVideo() {
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const motion = matchMedia(HERO_VIDEO.motionQuery);
    const wide = matchMedia(HERO_VIDEO.widthQuery);
    const connection = (navigator as Navigator & { connection?: Connection }).connection;
    let idle: number | undefined;
    let visible = false;
    let disposed = false;
    /** Chờ thời điểm rảnh sau load để không tranh tải ảnh LCP. */
    function update() {
      if (idle !== undefined) window.cancelIdleCallback(idle);
      const forced = new URLSearchParams(window.location.search).get(HERO_VIDEO.forceParam) === HERO_VIDEO.forceValue;
      const allowed = (HERO_VIDEO.enabled || forced) && canShowHeroVideo({ reducedMotion: motion.matches, saveData: connection?.saveData, width: wide.matches ? innerWidth : 0 });
      if (!allowed) { setReady(false); return; }
      if (visible && document.readyState === 'complete' && 'requestIdleCallback' in window) {
        idle = window.requestIdleCallback(() => { if (!disposed) setReady(true); });
      }
    }
    const observer = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      update();
    });
    if (host.current) observer.observe(host.current);
    motion.addEventListener('change', update);
    wide.addEventListener('change', update);
    connection?.addEventListener('change', update);
    window.addEventListener('load', update);
    update();
    return () => {
      disposed = true;
      observer.disconnect();
      if (idle !== undefined) window.cancelIdleCallback(idle);
      motion.removeEventListener('change', update);
      wide.removeEventListener('change', update);
      connection?.removeEventListener('change', update);
      window.removeEventListener('load', update);
    };
  }, []);
  return { host, ready };
}
