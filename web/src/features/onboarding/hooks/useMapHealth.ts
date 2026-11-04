import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import { MAP_FALLBACK_MS } from '../model/onboarding.const.ts';

/** Tình trạng bản đồ nền: đang tải, sẵn sàng, hoặc không tải được nên dùng sơ đồ minh họa thay thế. */
export type MapState = 'loading' | 'ready' | 'fallback';

/** Kết quả theo dõi: trạng thái hiện tại và một lời hứa hoàn tất khi không còn "đang tải" (để kịch bản chờ rồi chạy tiếp). */
export interface MapHealth {
  readonly state: MapState;
  readonly settled: Promise<void>;
}

const READY_SELECTOR = '.tmroot[data-ready="1"]';
const DEGRADED_SELECTOR = '.tm-degraded';

/**
 * Theo dõi bản đồ bên trong `host` (GeoMap đặt `data-ready="1"` khi kiểu bản đồ đã tải và dựng cảnh báo `.tm-degraded` khi nền lỗi).
 * Quá `MAP_FALLBACK_MS` mà chưa sẵn sàng, hoặc nền lỗi trước khi sẵn sàng, thì chuyển sang sơ đồ minh họa để cảnh không bao giờ trống.
 */
export function useMapHealth(host: RefObject<HTMLElement | null>): MapHealth {
  const [state, setState] = useState<MapState>('loading');
  const [gate] = useState(() => {
    let open: () => void = () => undefined;
    const settled = new Promise<void>((resolve) => {
      open = resolve;
    });
    return { settled, open };
  });
  useEffect(() => {
    const el = host.current;
    if (!el) return undefined;
    /** Đọc lại DOM của bản đồ và cập nhật trạng thái nếu đã rõ. */
    const check = (): void => {
      if (el.querySelector(READY_SELECTOR)) setState((s) => (s === 'loading' ? 'ready' : s));
      else if (el.querySelector(DEGRADED_SELECTOR)) setState((s) => (s === 'loading' ? 'fallback' : s));
    };
    const observer = new MutationObserver(check);
    observer.observe(el, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-ready'] });
    const timer = setTimeout(() => setState((s) => (s === 'loading' ? 'fallback' : s)), MAP_FALLBACK_MS);
    check();
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [host]);
  useEffect(() => {
    if (state !== 'loading') gate.open();
  }, [state, gate]);
  return { state, settled: gate.settled };
}
