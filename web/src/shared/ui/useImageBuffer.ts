import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { usePrefersReducedMotion } from '../hooks/useMediaQuery.ts';
import { decodeImage, decodeImageElement } from './imageDecode.ts';
import { MOTION } from './motion.const.ts';

interface ImageBuffer { readonly source: string | undefined; readonly previous: string | null; readonly ready: boolean }
interface ImageCallbacks { readonly onVisible?: (source: string) => void; readonly onSourceError?: () => void }

/** Giữ ảnh cũ trong lúc tải ảnh mới, bỏ kết quả lỗi thời khi bấm nhanh và giải phóng lớp crossfade sau một nhịp chung. */
export function useImageBuffer(source: string | undefined, callbacks: ImageCallbacks, imageRef: RefObject<HTMLImageElement | null>) {
  const reduced = usePrefersReducedMotion();
  const latest = useRef(callbacks);
  const initial = useRef(source);
  const decodedOnce = useRef(false);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const [buffer, setBuffer] = useState<ImageBuffer>({ source, previous: null, ready: false });
  useEffect(() => { latest.current = callbacks; });
  useEffect(() => {
    if (!source) return undefined;
    let active = true;
    const controller = new AbortController();
    const image = imageRef.current;
    const decoding = !decodedOnce.current && source === initial.current && image ? decodeImageElement(image, controller.signal) : decodeImage(source);
    void decoding.then(() => {
      if (!active) return;
      decodedOnce.current = true;
      setBuffer(current => ({ source, ready: true, previous: !reduced && current.ready && current.source !== source ? current.source ?? null : null }));
      latest.current.onVisible?.(source);
    }).catch(() => { if (active) { setFailedSource(source); latest.current.onSourceError?.(); } });
    return () => { active = false; controller.abort(); };
  }, [source, reduced, imageRef]);
  useEffect(() => {
    if (!buffer.previous) return undefined;
    const timer = window.setTimeout(() => setBuffer(current => current === buffer ? { ...current, previous: null } : current), MOTION.REVEAL_MS);
    return () => window.clearTimeout(timer);
  }, [buffer]);
  return { ...buffer, previous: reduced ? null : buffer.previous, pending: (!buffer.ready || buffer.source !== source) && failedSource !== source };
}
