import { useCallback, useEffect, useState } from 'react';
import { COPY, fill } from '../../../../shared/const/copy.vi.ts';
import { safeHttpUrl } from '../../../../shared/lib/safeUrl.ts';
import { Icon } from '../../../../shared/ui/Icon.tsx';
import { IconButton } from '../../../../shared/ui/IconButton.tsx';
import { RevealImage } from '../../../../shared/ui/RevealImage.tsx';
import { usePlaceSheet } from '../../hooks/PlaceSheetProvider.tsx';
import type { PhotoView, PlaceView } from '../../model/Catalog.types.ts';
import { PlacePlaceholder } from '../PlacePlaceholder.tsx';
import { QuickFacts } from './PlaceBody.tsx';

/** Hướng ảnh quyết định bố cục: dọc đứng cạnh các thông số, ngang nằm trên chúng. */
type Orientation = 'portrait' | 'landscape';

/** Cho màn cha gắn phím ←/→ vào đúng thanh ảnh. */
interface PlaceMediaProps {
  readonly place: PlaceView;
  readonly registerGo: (go: (delta: number) => void) => void;
}

/** Hướng theo kích thước thật của ảnh đã tải; vuông coi là ngang. */
function orientationOf(image: HTMLImageElement): Orientation {
  return image.naturalHeight > image.naturalWidth ? 'portrait' : 'landscape';
}

/** Đưa ảnh đang mở (từ thẻ/ghim đã chạm) lên đầu danh sách, giữ nguyên thứ tự còn lại. */
function orderedPhotos(place: PlaceView, opening: string | null): PhotoView[] {
  const photos = [...place.photos];
  const start = photos.findIndex((photo) => photo.url === opening);
  if (start > 0) photos.unshift(...photos.splice(start, 1));
  return photos;
}

/**
 * Một ảnh ở ĐÚNG tỷ lệ gốc (không crop, không letterbox, không nền mờ lấp chỗ): khung giữ chỗ trung tính tới khi ảnh sẵn sàng.
 * Báo hướng ảnh lên trên khi đã biết kích thước; ảnh lỗi hiện dòng "chưa tải được" kèm nút thử lại thay vì khung vỡ.
 */
function PhotoFrame({ photo, name, onOrientation, onVisible }: { readonly photo: PhotoView; readonly name: string; readonly onOrientation: (o: Orientation) => void; readonly onVisible: (source: string) => void }) {
  const [failedFor, setFailedFor] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  if (failedFor === photo.url) {
    return (
      <div className="pd-photo-failed" role="alert">
        <Icon name="alert-triangle" />
        <span>{COPY.place.photoFailed}</span>
        <button className="btn ghost" type="button" onClick={() => { setFailedFor(null); setAttempt((value) => value + 1); }}>{COPY.common.retry}</button>
      </div>
    );
  }
  return <RevealImage key={attempt} src={photo.url} alt={name} decoding="async" transitionFit="contain" onVisible={onVisible} onSourceError={() => setFailedFor(photo.url)} onLoad={event => onOrientation(orientationOf(event.currentTarget))} />;
}

/** Dòng ghi công ảnh đang xem (tác giả, giấy phép, nguồn): bắt buộc theo giấy phép nên luôn hiện dưới ảnh. */
function PhotoCredit({ photo }: { readonly photo: PhotoView }) {
  return (
    <p className="pd-credit">
      {photo.caption ? <span className="pd-photo-caption">{photo.caption}</span> : null}
      {photo.authorUrl ? <a href={safeHttpUrl(photo.authorUrl)} target="_blank" rel="noopener noreferrer">{fill(COPY.place.photoCreditShort, { author: photo.author || COPY.place.unknownAuthor, license: photo.license })}</a> : fill(COPY.place.photoCreditShort, { author: photo.author || COPY.place.unknownAuthor, license: photo.license })}
      {' · '}
      <a href={safeHttpUrl(photo.sourceUrl)} target="_blank" rel="noopener noreferrer">{COPY.place.sourceLink}</a>
    </p>
  );
}

/**
 * Phần ảnh của tờ chi tiết, một template cho mọi nơi: ảnh chính theo tỷ lệ gốc, thanh nhẹ (Xem ảnh gốc, trước/sau, số thứ tự), và 4 thông số.
 * Ảnh dọc đứng CẠNH thông số; ảnh ngang nằm TRÊN thông số. Chưa có ảnh thì dùng ô giữ chỗ có tên loại thật. Phím ←/→ do màn cha chuyển qua `registerGo`.
 */
export function PlaceMedia({ place, registerGo }: PlaceMediaProps) {
  const { openingPhoto } = usePlaceSheet();
  const photos = orderedPhotos(place, openingPhoto);
  const [index, setIndex] = useState(0);
  const [orientation, setOrientation] = useState<Orientation>('landscape');
  const count = photos.length;
  const current = photos[index];
  const [shownSource, setShownSource] = useState(current?.url);
  const shown = photos.find(photo => photo.url === shownSource) ?? current;
  /** Sang ảnh kề (delta ±1); dừng ở đầu/cuối. */
  const go = useCallback((delta: number): void => {
    setIndex((value) => Math.max(0, Math.min(count - 1, value + delta)));
  }, [count, setIndex]);
  useEffect(() => {
    registerGo(go);
  }, [go, registerGo]);
  return (
    <div className="pd-media" data-orient={current ? orientation : 'landscape'}>
      <div className="pd-photo-col">
        <div className="pd-photo" aria-label={fill(COPY.place.photosOf, { name: place.name })}>
          {current ? <PhotoFrame photo={current} name={place.name} onOrientation={setOrientation} onVisible={setShownSource} /> : <PlacePlaceholder place={place} />}
          {shown ? <a className="btn ghost pd-original" href={shown.url} target="_blank" rel="noopener noreferrer">{COPY.place.sourceOriginal}</a> : null}
        </div>
        {current ? (
          <>
            <div className="pd-bar">
              {count > 1 ? (
                <div className="pd-pager">
                  <IconButton className="pd-nav pd-prev" icon="chevron-left" label={COPY.place.prevPhoto} disabled={index === 0} onClick={() => go(-1)} />
                  <span className="pd-count" aria-live="polite">{`${index + 1} / ${count}`}</span>
                  <IconButton className="pd-nav pd-next" icon="chevron-left" flip label={COPY.place.nextPhoto} disabled={index === count - 1} onClick={() => go(1)} />
                </div>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
      <QuickFacts place={place} />
      {shown ? <PhotoCredit photo={shown} /> : null}
    </div>
  );
}
