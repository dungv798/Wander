import { COPY, fill } from '../../../../shared/const/copy.vi.ts';
import { RevealImage } from '../../../../shared/ui/RevealImage.tsx';
import type { DestinationSummary } from '../../model/Catalog.types.ts';
import { HOME } from '../../model/home.const.ts';
import { HOME_COPY } from '../../model/home.copy.ts';
import { HOME_PHOTOS } from '../../model/homePhotos.const.ts';

interface DestinationCardProps {
  readonly destination: DestinationSummary;
  readonly onSelect: () => void;
}

/** Thẻ ảnh dùng chung cho lưới và hàng cuộn: tên đặt trên ảnh (lớp tối ở đáy), số nơi là nhãn phụ; cả thẻ là một nút ≥ 44 px. */
export function DestinationCard({ destination, onSelect }: DestinationCardProps) {
  const photo = HOME_PHOTOS[destination.id];
  return (
    <button className="nh-card" type="button" onClick={onSelect}>
      <RevealImage src={photo ? `/catalog/photos/${photo.file}` : destination.coverUrl} style={{ objectPosition: photo?.position }} alt="" width={HOME.IMAGE_WIDTH} height={HOME.IMAGE_HEIGHT} loading="lazy" />
      <span className="nh-card-copy">
        <b>{destination.name}</b>
        <span className="nh-tag">{HOME_COPY.hooks[destination.id] ?? destination.tagline}</span>
      </span>
      <small className="nh-count">{fill(COPY.common.placeCountShort, { n: destination.placeCount })}</small>
    </button>
  );
}
