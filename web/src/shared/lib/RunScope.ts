/** Lỗi báo một lượt chạy đã bị thay thế hoặc hủy; chỉ dùng để dừng chuỗi bất đồng bộ cũ, không phải lỗi thật. */
export class RunCancelled extends Error {
  /** Tạo lỗi hủy với thông điệp cố định. */
  constructor() {
    super('run-cancelled');
    this.name = 'RunCancelled';
  }
}

/** Một lượt chạy: các hàm chờ/tween ném `RunCancelled` ngay khi lượt không còn hiệu lực. */
export interface Run {
  /** Lượt này còn là lượt mới nhất chưa bị hủy. */
  readonly alive: () => boolean;
  /** Chờ `ms` mili-giây. */
  readonly wait: (ms: number) => Promise<void>;
  /** Chờ một lời hứa ngoài rồi kiểm lượt còn hiệu lực. */
  readonly until: (promise: Promise<unknown>) => Promise<void>;
  /** Chạy hàm vẽ theo từng khung hình trong `ms`, đối số là tiến độ 0..1 đã làm mượt. */
  readonly tween: (ms: number, draw: (progress: number) => void) => Promise<void>;
}

const SMOOTH_A = 3;
const SMOOTH_B = 2;

/** Làm mượt hai đầu (smoothstep) của tiến độ 0..1. */
export function smoothstep(t: number): number {
  const k = Math.min(1, Math.max(0, t));
  return k * k * (SMOOTH_A - SMOOTH_B * k);
}

/**
 * Bộ quản lý "lượt chạy" cho hoạt họa kể chuyện: mở lượt mới là hủy lượt cũ, hủy là dọn sạch timer và khung hình đang chờ,
 * nên đổi cảnh hoặc người dùng chạm vào thì callback cũ không còn sửa được trạng thái mới.
 */
export class RunScope {
  private current = 0;
  private readonly pending = new Set<() => void>();

  /** Mở lượt mới (hủy lượt đang chạy, nếu có) và trả các hàm chờ gắn với lượt này. */
  begin(): Run {
    this.cancel();
    const id = this.current;
    const alive = (): boolean => id === this.current;
    /** Đăng ký một việc chờ; hủy lượt sẽ gọi `abort` để việc chờ bị từ chối ngay. */
    const track = (start: (settle: () => void, abort: () => void) => () => void): Promise<void> =>
      new Promise<void>((resolve, reject) => {
        let stop: () => void = () => undefined;
        const abort = (): void => {
          stop();
          this.pending.delete(abort);
          reject(new RunCancelled());
        };
        const settle = (): void => {
          this.pending.delete(abort);
          if (alive()) resolve();
          else reject(new RunCancelled());
        };
        this.pending.add(abort);
        stop = start(settle, abort);
      });
    const wait = (ms: number): Promise<void> =>
      track((settle) => {
        const timer = setTimeout(settle, ms);
        return () => clearTimeout(timer);
      });
    const until = (promise: Promise<unknown>): Promise<void> => track((settle) => {
      void promise.then(settle, settle);
      return () => undefined;
    });
    const tween = (ms: number, draw: (progress: number) => void): Promise<void> =>
      track((settle) => {
        const t0 = performance.now();
        let frame = 0;
        const step = (now: number): void => {
          const k = Math.min(1, (now - t0) / ms);
          draw(smoothstep(k));
          if (k < 1) frame = requestAnimationFrame(step);
          else settle();
        };
        frame = requestAnimationFrame(step);
        return () => cancelAnimationFrame(frame);
      });
    return { alive, wait, until, tween };
  }

  /** Hủy lượt hiện tại: mọi việc đang chờ bị từ chối bằng `RunCancelled`. */
  cancel(): void {
    this.current += 1;
    for (const abort of [...this.pending]) abort();
  }

  /** Chạy `script` trong một lượt mới; `RunCancelled` bị nuốt, lỗi khác được ném lại. */
  async start(script: (run: Run) => Promise<void>): Promise<void> {
    try {
      await script(this.begin());
    } catch (error) {
      if (!(error instanceof RunCancelled)) throw error;
    }
  }
}
