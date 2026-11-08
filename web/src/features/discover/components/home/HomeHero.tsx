import { RevealImage } from '../../../../shared/ui/RevealImage.tsx';
import { Button } from '../../../../shared/ui/Button.tsx';
import type { DestinationSummary } from '../../model/Catalog.types.ts';
import { HOME } from '../../model/home.const.ts';
import { CreditPill } from '../CreditPill.tsx';
import { useCreditPill } from '../../hooks/useCreditPill.ts';
import { COPY } from '../../../../shared/const/copy.vi.ts';
import { IconButton } from '../../../../shared/ui/IconButton.tsx';

interface HomeHeroProps {
  /** Điểm đến được nhấn mạnh: chỉ cần mã, tên, câu giới thiệu và ảnh bìa dự phòng. */
  readonly destination: Pick<DestinationSummary, 'id' | 'name' | 'tagline' | 'coverUrl' | 'coverPhoto'>;
  /** Dòng nhỏ phía trên tên (ví dụ "Điểm đến gợi ý"). */
  readonly eyebrow: string;
  /** Nhãn nút chính; nút luôn có mũi tên "đi tiếp". */
  readonly cta: string;
  readonly onOpen: () => void;
}

/**
 * Thẻ hero một điểm đến: ảnh thật phủ thẻ, tên lớn và MỘT nút chính; dùng cho cả Trang chủ lần đầu (điểm đến gợi ý) lẫn Trang chủ đã chọn điểm đến.
 * Ảnh lấy từ bộ ảnh hero đã tuyển, không có thì dùng ảnh bìa danh mục; chữ nằm trên lớp tối ở đáy để đọc được trên ảnh bất kỳ.
 */
export function HomeHero({ destination, eyebrow, cta, onOpen }: HomeHeroProps) {
  const src = destination.coverUrl;
  const credit = useCreditPill(0);
  return (
    <section className="home-hero-card" aria-label={destination.name}>
      <RevealImage src={src} alt="" width={HOME.IMAGE_WIDTH} height={HOME.IMAGE_HEIGHT} loading="eager" />
      <div className="hhc-in">
        <p className="hhc-eyebrow">{eyebrow}</p>
        <h2>{destination.name}</h2>
        <p className="hhc-tag">{destination.tagline}</p>
        <Button arrow onClick={onOpen}>{cta}</Button>
      </div>
      {destination.coverPhoto ? <div className="hhc-credit"><IconButton icon="info-circle" label={COPY.deck.creditAria} aria-expanded={credit.open} onClick={credit.toggle} />{credit.open ? <CreditPill photo={destination.coverPhoto} fullAuthor /> : null}</div> : null}
    </section>
  );
}
