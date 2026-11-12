import { useSyncExternalStore } from 'react';
import { pendingRequests } from '../api/PendingTracker.ts';
import { COPY } from '../const/copy.vi.ts';
import './slowNotice.css';

/**
 * Dải báo chung "máy chủ đang thức dậy" (B-05): hiện khi có lời gọi API treo quá `SLOW_REQUEST_AFTER_MS`, biến mất khi lời gọi xong.
 * Là nguồn duy nhất của lời báo này, nên màn tải, lưu chuyến hay bất kỳ hành động nào đang chờ máy chủ đều được giải thích như nhau.
 */
export function SlowServerNotice() {
  const slow = useSyncExternalStore(pendingRequests.subscribe, () => pendingRequests.slow);
  if (!slow) return null;
  return <p className="slow-notice" role="status">{COPY.common.slowLoad}</p>;
}
