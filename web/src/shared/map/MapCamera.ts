import { MAP } from './map.const.ts';
import { clampCamera, mapEase } from './mapGeometry.ts';
import type { Camera, Insets, Size } from './map.types.ts';

/** Gọi lại của camera: mỗi khung hình khi bay/kéo, và khi dừng hẳn. */
export interface CameraHooks {
  readonly onFrame: () => void;
  readonly onSettled: () => void;
}

const NO_INSET: Insets = { top: 0, right: 0, bottom: 0, left: 0 };

/** Camera của bản đồ: trạng thái (tâm, tỉ lệ), kích thước khung, vùng bị che và hoạt họa bay mượt. */
export class MapCamera {
  cam: Camera = { cx: 0, cy: 0, s: MAP.INITIAL_SCALE };
  size: Size = { w: 1, h: 1 };
  inset: Insets = NO_INSET;
  minScale: number = MAP.MIN_SCALE;
  /** Kích thước vùng dữ liệu (ảnh nền); null khi chưa tải. */
  bounds: Size | null = null;
  private raf = 0;
  private readonly hooks: CameraHooks;

  /** Tạo camera với các gọi lại để bản đồ vẽ lại ghim/nhãn. */
  constructor(hooks: CameraHooks) {
    this.hooks = hooks;
  }

  /** Dừng hoạt họa đang chạy (khi người dùng chạm kéo hoặc hủy bản đồ). */
  cancel(): void {
    cancelAnimationFrame(this.raf);
  }

  /** Đặt vùng nhìn thấy thật sự (ví dụ trừ phần tờ dưới che) để căn giữa đúng. */
  setInsets(inset: Partial<Insets>): void {
    this.inset = { ...NO_INSET, ...inset };
  }

  /** Đặt camera ngay (đã kẹp trong vùng dữ liệu). Không vẽ; người gọi tự gọi `hooks`. */
  set(cam: Camera): void {
    this.cam = this.bounds ? clampCamera(cam, this.bounds, this.minScale) : cam;
  }

  /** Bay camera tới đích; không hoạt họa (hoặc giảm chuyển động, chưa có dữ liệu) thì nhảy luôn. */
  flyTo(target: Camera, animate: boolean, reduced: boolean): void {
    this.cancel();
    const to = this.bounds ? clampCamera(target, this.bounds, this.minScale) : target;
    if (!animate || reduced || !this.bounds) {
      this.cam = to;
      this.hooks.onFrame();
      this.hooks.onSettled();
      return;
    }
    const from = this.cam;
    const t0 = performance.now();
    const ls = Math.log(from.s);
    const le = Math.log(to.s);
    /** Một khung hình bay: nội suy tâm tuyến tính và tỉ lệ theo log để phóng/thu cảm giác đều. */
    const step = (now: number): void => {
      const t = Math.min(1, (now - t0) / MAP.FLY_MS);
      const e = mapEase(t);
      this.cam = { cx: from.cx + (to.cx - from.cx) * e, cy: from.cy + (to.cy - from.cy) * e, s: Math.exp(ls + (le - ls) * e) };
      this.hooks.onFrame();
      if (t < 1) this.raf = requestAnimationFrame(step);
      else this.hooks.onSettled();
    };
    this.raf = requestAnimationFrame(step);
  }
}
