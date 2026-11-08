import { ApiError } from '../../../shared/api/ApiError.ts';
import { UNKNOWN_CODE } from '../../../shared/api/errorMessages.const.ts';
import { IDENTITY } from './identity.const.ts';
import { PAIRING_POLL as P } from './pairingPoll.const.ts';
import type { PairingStatus } from './identity.types.ts';

/** Lỗi mạng hoặc HTTP 429 được tự thử im lặng; lỗi khác phải được báo qua cổng lỗi hiện có. */
export function isRetryablePairingError(error: unknown): boolean {
  return error instanceof ApiError && (error.isNetwork || error.status === P.RATE_LIMIT_STATUS);
}

/** Nhân đôi khoảng chờ liên tiếp, có trần; một phản hồi thành công đưa về nhịp gốc. */
export function nextPairingDelay(current: number): number {
  return Math.min(current * P.BACKOFF_FACTOR, P.MAX_DELAY_MS);
}

interface PollOptions {
  readonly expiresAt: number;
  readonly readStatus: (signal: AbortSignal) => Promise<PairingStatus>;
  readonly approved: () => Promise<void>;
  readonly finish: (outcome: 'denied' | 'expired') => void;
  readonly report: (error: unknown) => void;
  readonly joinFailed: () => void;
}

type Visibility = Pick<Document, 'hidden' | 'addEventListener' | 'removeEventListener'>;

/** Một vòng poll sở hữu HTTP, bộ hẹn và bộ nghe của đúng lần dựng màn. */
class PairingPoll {
  private disposed = false;
  private stopped = false;
  private inFlight = false;
  private delay: number = IDENTITY.POLL_MS;
  private lastErrorCode: string | null = null;
  private nextAt = Date.now() + this.delay;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private readonly expiryTimer: ReturnType<typeof setTimeout>;
  private readonly abort = new AbortController();
  private readonly options: PollOptions;
  private readonly visibility: Visibility;

  /** Hạn cục bộ chạy độc lập với HTTP chậm; không đổi bước duyệt của máy chủ. */
  constructor(options: PollOptions, visibility: Visibility) {
    this.options = options;
    this.visibility = visibility;
    this.expiryTimer = setTimeout(() => this.expire(), Math.max(0, options.expiresAt + 1 - Date.now()));
    visibility.addEventListener(P.VISIBILITY_EVENT, this.onVisibility);
    this.schedule();
  }

  /** Gỡ bộ hẹn, bộ nghe và hủy HTTP; mọi kết quả đến muộn đều bị bỏ qua. */
  stop = (): void => {
    this.disposed = true;
    clearTimeout(this.timer);
    clearTimeout(this.expiryTimer);
    this.abort.abort();
    this.visibility.removeEventListener(P.VISIBILITY_EVENT, this.onVisibility);
  };

  /** Chặn mọi lần hỏi tiếp sau trạng thái cuối nhưng vẫn cho phép hoàn tất nhận phiên. */
  private finish(): void {
    this.stopped = true;
    clearTimeout(this.timer);
    clearTimeout(this.expiryTimer);
  }

  /** Hết hạn ngay cả khi HTTP chưa trả về; không báo lỗi hủy do chính vòng poll tạo ra. */
  private expire(): void {
    if (this.disposed || this.stopped) return;
    this.finish();
    this.abort.abort();
    this.options.finish('expired');
  }

  /** Đặt lần hỏi tiếp theo, không tạo bộ hẹn HTTP khi màn ẩn. */
  private schedule(): void {
    if (this.disposed || this.stopped || this.visibility.hidden) return;
    this.timer = setTimeout(() => { void this.poll(); }, Math.max(0, this.nextAt - Date.now()));
  }

  /** Hiện lại kiểm ngay nếu đã tới nhịp, vẫn giữ backoff và không gọi chồng HTTP đang chạy. */
  private readonly onVisibility = (): void => {
    clearTimeout(this.timer);
    if (!this.inFlight) this.schedule();
  };

  /** Mỗi lượt chỉ gửi một HTTP; mọi lỗi lùi có trần, thành công reset nhịp và chuỗi lỗi đã báo. */
  private async poll(): Promise<void> {
    if (this.disposed || this.stopped || this.inFlight || this.visibility.hidden) return;
    if (Date.now() > this.options.expiresAt) { this.expire(); return; }
    this.inFlight = true;
    try {
      const status = await this.options.readStatus(this.abort.signal);
      if (this.disposed || this.stopped) return;
      this.delay = IDENTITY.POLL_MS;
      this.lastErrorCode = null;
      if (status === 'approved') {
        this.finish();
        await this.options.approved().catch((error: unknown) => {
          if (this.disposed) return;
          this.options.report(error);
          this.options.joinFailed();
        });
      } else if (status === 'denied' || status === 'expired') {
        this.finish();
        this.options.finish(status);
      }
    } catch (error) {
      if (this.disposed || this.stopped) return;
      this.delay = nextPairingDelay(this.delay);
      const code = error instanceof ApiError ? error.code : UNKNOWN_CODE;
      if (code !== this.lastErrorCode && !isRetryablePairingError(error)) this.options.report(error);
      this.lastErrorCode = code;
    } finally {
      this.inFlight = false;
      this.nextAt = Date.now() + this.delay;
      this.schedule();
    }
  }
}

/** Poll tuần tự, ngủ khi ẩn; trả cổng hủy để effect dọn sạch lúc gỡ hoặc đổi yêu cầu. */
export function startPairingPoll(options: PollOptions, visibility: Visibility = document): () => void {
  return new PairingPoll(options, visibility).stop;
}
