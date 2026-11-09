import { TRIP_IMAGES } from '../model/tripImages.const.ts';
import { fill } from '../../../shared/const/copy.vi.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { firstPhotoUrl } from '../../discover/index.ts';
import type { DestinationDetail } from '../../discover/index.ts';
import { COLLAB_COPY } from '../../collab/index.ts';
import { coverUrl, gradientStyle } from '../model/cover.ts';
import type { Trip } from '../model/trip.types.ts';
import { countText } from '../model/tripView.ts';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';
import { dateRangeText } from './TripCard.tsx';
import { useTripView } from '../hooks/TripViewContext.tsx';

interface TripCoverHeadProps {
  readonly trip: Trip;
  readonly dest: DestinationDetail;
  /** Mở tờ "Người đi cùng" (mời, thành viên, quyền). */
  readonly onPeople: () => void;
  /** Gọn: tên + ngày một hàng, hai nút chỉ còn biểu tượng (nhãn vẫn có cho trình đọc màn hình). Dùng ở các tab danh sách để mục lịch lên cao hơn. */
  readonly compact?: boolean;
}

/**
 * Bìa chuyến ở đầu tờ: ảnh (hoặc màu bìa đã chọn), tên, ngày, số mục, và nhóm hành động chia sẻ ngay trên bìa:
 * "Người đi cùng" (mời bằng liên kết, thành viên, đề nghị) và "Chia sẻ lịch" (lưu/gửi lịch trình).
 * `compact` thu bìa còn một dải thấp (tab Lịch/Chưa xếp/Chi phí); tab Tổng quan giữ bìa đầy đủ.
 */
export function TripCoverHead({ trip, dest, onPeople, compact = false }: TripCoverHeadProps) {
  const { setOverlay } = useTripView();
  const first = trip.items.map((i) => dest.places.find((p) => p.id === i.placeId)).find(Boolean);
  const image = coverUrl(trip.cover, dest, first ? firstPhotoUrl(first) : dest.coverUrl);
  return (
    <div className="trip-cover-card" data-compact={compact || undefined} data-cover={gradientStyle(trip.cover) ? 'gradient' : 'photo'} style={gradientStyle(trip.cover)}>
      {/* Bìa ở đầu màn có thể là LCP, giữ tải ngay thay vì lazy. */}
      {image ? <img decoding="async" width={TRIP_IMAGES.COVER.width} height={TRIP_IMAGES.COVER.height} alt="" src={image} /> : null}
      <div className="tcc-in">
        <h1>{trip.name}</h1>
        <p>{`${dateRangeText(trip)} · ${countText(trip)}`}</p>
      </div>
      <div className="tcc-actions">
        <Button kind="ghost" icon="users" onClick={onPeople}>
          <span className="tcc-label">{trip.memberCount > 1 ? fill(COLLAB_COPY.people.open, { n: trip.memberCount }) : T.create.invite}</span>
        </Button>
        <Button kind="ghost" icon="share-2" onClick={() => setOverlay({ kind: 'share' })}>
          <span className="tcc-label">{T.view.share}</span>
        </Button>
      </div>
    </div>
  );
}
