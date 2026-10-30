import { RevealImage } from '../../../../shared/ui/RevealImage.tsx';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { COPY, fill } from '../../../../shared/const/copy.vi.ts';
import { Icon } from '../../../../shared/ui/Icon.tsx';
import { IconButton } from '../../../../shared/ui/IconButton.tsx';
import { useCreditPill } from '../../hooks/useCreditPill.ts';
import { useGallery } from '../../hooks/useGallery.ts';
import { CreditPill } from '../CreditPill.tsx';
import { PlaceHeroMeta } from './PlaceHeroMeta.tsx';
import type { PlaceView } from '../../model/Catalog.types.ts';
import { usePlaceSheet } from '../../hooks/PlaceSheetProvider.tsx';

interface PlaceGalleryProps {
  readonly place: PlaceView;
  readonly onClose: () => void;
  /** Cho phép màn cha gắn phím ←/→ vào đúng thư viện ảnh. */
  readonly registerGo: (go: (delta: number) => void) => void;
}

/** Thư viện ảnh đầu tờ chi tiết: cuộn/kéo/nút/phím, số ảnh, chấm, nhãn loại, nút đóng và nút nguồn ảnh (ghi công bắt buộc). */
export function PlaceGallery({ place, onClose, registerGo }: PlaceGalleryProps): ReactNode {
  const { openingPhoto } = usePlaceSheet();
  const photos = [...place.photos];
  const start = photos.findIndex((photo) => photo.url === openingPhoto);
  if (start > 0) photos.unshift(...photos.splice(start, 1));
  const n = place.photos.length;
  const { ref, index, go, pointer } = useGallery(n);
  const credit = useCreditPill(index);

  useEffect(() => {
    registerGo(go);
  }, [go, registerGo]);

  return (
    <div className={`gal cat-${place.category}`}>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- vùng cuộn ngang phải focus được bằng bàn phím (WCAG 2.1.1) */}
      <div ref={ref} className="gallery" tabIndex={0} aria-label={fill(COPY.place.photosOf, { name: place.name })} {...pointer}>
        {photos.map((p) => (
          <RevealImage key={p.url} alt={place.name} src={p.url} />
        ))}
      </div>
      <div className="place-hero-scrim" aria-hidden="true" />
      <PlaceHeroMeta place={place} />
      {n > 1 ? (
        <>
          <button className="gnav prev" type="button" aria-label={COPY.place.prevPhoto} disabled={index === 0} onClick={() => go(-1)}>
            <Icon name="chevron-left" size="l" />
          </button>
          <button className="gnav next" type="button" aria-label={COPY.place.nextPhoto} disabled={index === n - 1} onClick={() => go(1)}>
            <Icon name="chevron-left" size="l" className="flip" />
          </button>
          <div className="dots">
            {photos.map((p, k) => (
              <i key={p.url} className={k === index ? 'on' : undefined} />
            ))}
          </div>
        </>
      ) : null}
      {n ? <span className="gcount" aria-live="polite">{`${index + 1} / ${n}`}</span> : null}
      <IconButton className="close" icon="x" label={COPY.common.close} onClick={onClose} />
      <button className="credit-btn" type="button" aria-label={COPY.place.photoCredit} onClick={credit.toggle}>
        <Icon name="info-circle" />
      </button>
      {credit.open ? <CreditPill photo={photos[index]} /> : null}
    </div>
  );
}
