import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import { MAP_FALLBACK_MS } from '../model/onboarding.const.ts';

/** The state of the base map: loading, ready, or could not load so the illustrative diagram is used instead. */
export type MapState = 'loading' | 'ready' | 'fallback';

/** The watch result: the current state and a promise that completes when it is no longer 'loading' (so the script waits and then goes on). */
export interface MapHealth {
  readonly state: MapState;
  readonly settled: Promise<void>;
}

const READY_SELECTOR = '.tmroot[data-ready="1"]';
const DEGRADED_SELECTOR = '.tm-degraded';

/**
 * Watches the map inside `host` (GeoMap sets `data-ready="1"` when the map style has loaded and builds a `.tm-degraded` warning when the base fails).
 * Past `MAP_FALLBACK_MS` while not ready, or the base failing before it is ready, switches to the illustrative diagram so the scene is never empty.
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
    /** Re-reads the map's DOM and updates the state if it is clear. */
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
