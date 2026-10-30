import { PIN_ENTRANCE } from './pinEntrance.const.ts';

/** Không trì hoãn ghim thông thường; chế độ quay thêm lần lượt một ghim mỗi nhịp. */
export function entranceCount(total: number, elapsed: number, enabled: boolean, reducedMotion: boolean): number {
  if (!enabled || reducedMotion) return total;
  return Math.min(total, Math.max(0, Math.floor(elapsed / PIN_ENTRANCE.staggerMs) + 1));
}
