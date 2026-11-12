import { PIN_ENTRANCE } from './pinEntrance.const.ts';

/** It does not delay ordinary pins; recording mode adds one pin per beat in turn. */
export function entranceCount(total: number, elapsed: number, enabled: boolean, reducedMotion: boolean): number {
  if (!enabled || reducedMotion) return total;
  return Math.min(total, Math.max(0, Math.floor(elapsed / PIN_ENTRANCE.staggerMs) + 1));
}
