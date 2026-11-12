import { fill } from '../../../shared/const/copy.vi.ts';
import { agoText } from '../../../shared/lib/agoText.ts';
import { useNow } from '../../../shared/hooks/useNow.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { useTrips } from '../hooks/TripsProvider.tsx';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';
import './staleNotice.css';

/** Làm mới nhãn "… phút trước" mỗi phút (mili giây). */
const REFRESH_MS = 60_000;

/**
 * Dải báo "đang xem bản đã lưu lúc …" khi máy chủ không trả lời mà vẫn có bản chuyến lần trước (B-09): người dùng biết dữ liệu có thể cũ và
 * chưa sửa được, kèm nút Thử lại. Không hiện khi dữ liệu là bản mới nhất từ máy chủ.
 */
export function StaleTripsNotice() {
  const { staleSince, reload } = useTrips();
  const now = useNow(REFRESH_MS);
  if (staleSince === null) return null;
  return (
    <div className="stale-notice pad-x" role="status">
      <p>{fill(T.stale.text, { ago: agoText(staleSince, now) })}</p>
      <Button kind="ghost" onClick={reload}>{T.stale.retry}</Button>
    </div>
  );
}
