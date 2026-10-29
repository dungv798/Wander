import type { Trip } from '../../trips/index.ts';
import type { DestinationDetail } from './Catalog.types.ts';
import { HOME } from './home.const.ts';

/** Lấy ảnh bìa trước, sau đó ảnh nổi bật không trùng URL; kho ít ảnh thì giữ đúng số ảnh thật. */
export function heroImages(dest: DestinationDetail): readonly string[] {
  return [...new Set([dest.coverUrl, ...dest.places.map(p => p.photos[0]?.url ?? '')])].filter(Boolean).slice(0, HOME.HERO_IMAGES);
}

/** Ưu tiên chuyến đang diễn ra, rồi chuyến sắp đi gần nhất, cuối cùng bản đang làm mới nhất. */
export function homeTrip(trips: readonly Trip[], today: string): Trip | null {
  const dated = trips.filter(t => !t.datesTentative);
  return dated.find(t => t.startDate <= today && t.endDate >= today)
    ?? [...dated].filter(t => t.startDate > today).sort((a, b) => a.startDate.localeCompare(b.startDate))[0]
    ?? [...trips].sort((a, b) => b.createdAt - a.createdAt)[0] ?? null;
}

/** Chỉ một nhánh tiếp tục được hiện; chuyến có sẵn luôn ưu tiên hơn nơi chọn dở. */
export function resumeKind(hasTrip: boolean, pickedCount: number): 'trip' | 'picked' | null {
  return hasTrip ? 'trip' : pickedCount > 0 ? 'picked' : null;
}
