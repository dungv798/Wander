import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';

/** Đợi sau load và idle mới tải cả mã chọn video để bảo vệ ngân sách JS và ảnh LCP. */
export function DeferredHeroVideo() {
  const [Player, setPlayer] = useState<ComponentType | null>(null);
  useEffect(() => {
    let disposed = false;
    let idle: number | undefined;
    /** Trình duyệt thiếu idle API tiếp tục dùng ảnh tĩnh. */
    function load() {
      if ('requestIdleCallback' in window) idle = window.requestIdleCallback(() => {
        void import('./HeroVideo.tsx').then(module => { if (!disposed) setPlayer(() => module.default); }).catch(() => {});
      });
    }
    if (document.readyState === 'complete') load();
    else window.addEventListener('load', load, { once: true });
    return () => {
      disposed = true;
      window.removeEventListener('load', load);
      if (idle !== undefined) window.cancelIdleCallback(idle);
    };
  }, []);
  return Player ? <Player /> : null;
}
