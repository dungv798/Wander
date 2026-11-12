import type { CSSProperties } from 'react';
import type { DestinationDetail } from '../../discover/index.ts';
import type { TripCover } from './trip.types.ts';
import { COVER, COVER_GRADIENTS } from './cover.const.ts';

/** Một ảnh chọn được; giữ ghi công và URL gốc từ catalog. */
export interface CoverPhoto {
  readonly ref: string;
  readonly url: string;
  readonly place: string;
  readonly author: string;
  readonly license: string;
  readonly sourceUrl: string;
}

/** Kiểm dữ liệu mạng trước khi dùng vào CSS; dữ liệu cũ hoặc sai về mặc định. */
export function parseCover(raw: unknown): TripCover | null {
  if (!raw || typeof raw !== 'object' || !('kind' in raw) || !('ref' in raw) || typeof raw.ref !== 'string') return null;
  if (raw.kind === 'gradient' && COVER_GRADIENTS.some(g => g.ref === raw.ref)) return { kind: raw.kind, ref: raw.ref };
  if (raw.kind === 'photo' && raw.ref.length <= COVER.maxRefLength && COVER.slug.test(raw.ref)) return { kind: raw.kind, ref: raw.ref };
  return null;
}

/** Chỉ lấy ảnh catalog của điểm đến, bỏ trùng; mã lấy từ tên tệp, không cho nhập URL. */
function catalogPhotos(dest: DestinationDetail): CoverPhoto[] {
  const seen = new Set<string>();
  return dest.places.flatMap(place => place.photos.flatMap(photo => {
    const ref = photo.id ?? COVER.photoPath.exec(photo.url)?.[1];
    if (!ref || ref.length > COVER.maxRefLength || seen.has(ref)) return [];
    seen.add(ref);
    return [{ ...photo, ref, place: place.name }];
  }));
}

/** Lưới nhỏ tối đa 12 ảnh, giữ thứ tự biên tập của catalog. */
export function coverPhotos(dest: DestinationDetail): CoverPhoto[] {
  return catalogPhotos(dest).slice(0, COVER.maxPhotos);
}

/** Ảnh đã chọn được tra trong toàn bộ catalog; mã mất/khác điểm đến quay về ảnh mặc định hiện có. */
export function coverUrl(cover: TripCover | null | undefined, dest: DestinationDetail | null, fallback: string): string {
  const selected = parseCover(cover);
  if (selected?.kind === 'gradient') return '';
  return selected && dest ? catalogPhotos(dest).find(photo => photo.ref === selected.ref)?.url ?? fallback : fallback;
}

/** Chỉ tạo CSS cho gradient thuộc tập đóng; không nội suy giá trị tùy ý từ mạng. */
export function gradientStyle(cover: TripCover | null | undefined): CSSProperties | undefined {
  const selected = parseCover(cover);
  return selected?.kind === 'gradient' ? { background: `var(--${selected.ref})` } : undefined;
}
