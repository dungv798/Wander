import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';

/** Chỉ tải mã chọn video sau tương tác và idle để bảo vệ ảnh LCP. */
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
    window.addEventListener('pointerdown', load, { once: true });
    window.addEventListener('keydown', load, { once: true });
    return () => {
      disposed = true;
      window.removeEventListener('pointerdown', load);
      window.removeEventListener('keydown', load);
      if (idle !== undefined) window.cancelIdleCallback(idle);
    };
  }, []);
  return Player ? <Player /> : null;
}
