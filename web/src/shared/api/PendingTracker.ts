import { SLOW_REQUEST_AFTER_MS } from './slowRequest.const.ts';

/** Hẹn chạy `fn` sau `ms` mili giây; trả hàm hủy hẹn (tiêm được khi test). */
export type Scheduler = (fn: () => void, ms: number) => () => void;

/** Bộ hẹn giờ mặc định của trình duyệt. */
const browserSchedule: Scheduler = (fn, ms) => {
  const id = setTimeout(fn, ms);
  return () => clearTimeout(id);
};

/**
 * Theo dõi các lời gọi API đang chờ: `slow` là true chừng nào còn ít nhất một lời gọi đã treo quá ngưỡng mà chưa xong.
 * Lời gọi nhanh không bao giờ làm đổi trạng thái, nên người nghe chỉ bị đánh thức khi `slow` thật sự đổi.
 */
export class PendingTracker {
  private readonly slowAfterMs: number;
  private readonly schedule: Scheduler;
  private readonly listeners = new Set<() => void>();
  private overdue = 0;

  /** Tạo bộ theo dõi; ngưỡng và bộ hẹn giờ tiêm được để test không phải chờ thật. */
  constructor(slowAfterMs: number = SLOW_REQUEST_AFTER_MS, schedule: Scheduler = browserSchedule) {
    this.slowAfterMs = slowAfterMs;
    this.schedule = schedule;
  }

  /** Có lời gọi nào đang treo quá ngưỡng. */
  get slow(): boolean {
    return this.overdue > 0;
  }

  /** Báo một lời gọi bắt đầu; trả hàm gọi khi lời gọi kết thúc (thành công, lỗi hay hủy). Gọi nhiều lần chỉ tính một. */
  begin(): () => void {
    let finished = false;
    let counted = false;
    const cancel = this.schedule(() => {
      if (finished) return;
      counted = true;
      this.overdue += 1;
      if (this.overdue === 1) this.emit();
    }, this.slowAfterMs);
    return () => {
      if (finished) return;
      finished = true;
      cancel();
      if (!counted) return;
      this.overdue -= 1;
      if (this.overdue === 0) this.emit();
    };
  }

  /** Đăng ký nghe thay đổi của `slow`; trả hàm hủy đăng ký. Chữ ký khớp `useSyncExternalStore`. */
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /** Đánh thức mọi người nghe. */
  private emit(): void {
    for (const listener of this.listeners) listener();
  }
}

/** Bộ theo dõi dùng chung của ứng dụng, gắn vào `apiClient`. */
export const pendingRequests = new PendingTracker();
