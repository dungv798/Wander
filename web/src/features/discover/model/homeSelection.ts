import type { Trip } from '../../trips/index.ts';
import type { DestinationDetail } from './Catalog.types.ts';
import { HERO_PHOTOS } from './heroPhotos.const.ts';

/** Chỉ lấy ảnh đã chấm và còn trong catalog; không có ảnh đạt thì giữ ảnh bìa. */
export function heroImages(dest: DestinationDetail): readonly string[] {
  const photos = dest.places.flatMap(p => p.photos);
  const selected = (HERO_PHOTOS[dest.id] ?? []).flatMap(file => {
    const photo = photos.find(p => p.url.endsWith(`/${file}`));
    return photo ? [photo.url] : [];
  });
  return selected.length ? selected : dest.coverUrl ? [dest.coverUrl] : [];
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
