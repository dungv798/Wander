import { HERO_VIDEO } from './heroVideo.const.ts';

/** Chỉ cho phép video khi người xem không tiết kiệm dữ liệu, không giảm chuyển động và màn đủ rộng. */
export function canShowHeroVideo({ reducedMotion, saveData, width }: { reducedMotion: boolean; saveData?: boolean; width: number }): boolean {
  return !reducedMotion && !saveData && width >= HERO_VIDEO.minWidth;
}
