import type { ImgHTMLAttributes } from 'react';
import { useRef } from 'react';
import { IMAGE_SIZE, MOTION } from './motion.const.ts';
import { useImageBuffer } from './useImageBuffer.ts';

interface RevealImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  readonly transitionFit?: 'cover' | 'contain';
  readonly onVisible?: (source: string) => void;
  readonly onSourceError?: () => void;
}

/** An img that keeps the old photo until the new photo has decoded; the old photo layer fades above it, not fading in from an empty background. */
export function RevealImage({ src, alt = '', width = IMAGE_SIZE.WIDTH, height = IMAGE_SIZE.HEIGHT, transitionFit = 'cover', onVisible, onSourceError, ...props }: RevealImageProps) {
  const ref = useRef<HTMLImageElement | null>(null);
  const buffer = useImageBuffer(src, { onVisible, onSourceError }, ref);
  if (!src) return <span className={['img-ph', props.className].filter(Boolean).join(' ')} role={alt ? 'img' : undefined} aria-label={alt || undefined} aria-hidden={alt ? undefined : true} />;
  return <>
    <img {...props} ref={ref} alt={alt} src={buffer.source} width={width} height={height} data-image-ready={buffer.ready} aria-busy={buffer.pending || undefined} />
    {buffer.previous ? <span className="image-outgoing" data-fit={transitionFit} aria-hidden="true" style={{ backgroundImage: `url(${JSON.stringify(buffer.previous)})`, animationDuration: `${MOTION.REVEAL_MS}ms` }} /> : null}
  </>;
}
