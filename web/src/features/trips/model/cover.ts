import type { CSSProperties } from 'react';
import type { DestinationDetail } from '../../discover/index.ts';
import type { TripCover } from './trip.types.ts';
import { COVER, COVER_GRADIENTS } from './cover.const.ts';

/** A photo that can be chosen; keeps the attribution and the original URL from the catalog. */
export interface CoverPhoto {
  readonly ref: string;
  readonly url: string;
  readonly place: string;
  readonly author: string;
  readonly license: string;
  readonly sourceUrl: string;
}

/** Checks network data before using it in CSS; old or wrong data goes back to the default. */
export function parseCover(raw: unknown): TripCover | null {
  if (!raw || typeof raw !== 'object' || !('kind' in raw) || !('ref' in raw) || typeof raw.ref !== 'string') return null;
  if (raw.kind === 'gradient' && COVER_GRADIENTS.some(g => g.ref === raw.ref)) return { kind: raw.kind, ref: raw.ref };
  if (raw.kind === 'photo' && raw.ref.length <= COVER.maxRefLength && COVER.slug.test(raw.ref)) return { kind: raw.kind, ref: raw.ref };
  return null;
}

/** Takes only the destination's catalog photos, dropping duplicates; the id comes from the file name, entering a URL is not allowed. */
function catalogPhotos(dest: DestinationDetail): CoverPhoto[] {
  const seen = new Set<string>();
  return dest.places.flatMap(place => place.photos.flatMap(photo => {
    const ref = photo.id ?? COVER.photoPath.exec(photo.url)?.[1];
    if (!ref || ref.length > COVER.maxRefLength || seen.has(ref)) return [];
    seen.add(ref);
    return [{ ...photo, ref, place: place.name }];
  }));
}

/** A small grid of at most 12 photos, keeping the catalog's editorial order. */
export function coverPhotos(dest: DestinationDetail): CoverPhoto[] {
  return catalogPhotos(dest).slice(0, COVER.maxPhotos);
}

/** The chosen photo is looked up in the whole catalog; a missing id/one from another destination goes back to the existing default photo. */
export function coverUrl(cover: TripCover | null | undefined, dest: DestinationDetail | null, fallback: string): string {
  const selected = parseCover(cover);
  if (selected?.kind === 'gradient') return '';
  return selected && dest ? catalogPhotos(dest).find(photo => photo.ref === selected.ref)?.url ?? fallback : fallback;
}

/** Only creates CSS for a gradient in the closed set; it does not interpolate an arbitrary value from the network. */
export function gradientStyle(cover: TripCover | null | undefined): CSSProperties | undefined {
  const selected = parseCover(cover);
  return selected?.kind === 'gradient' ? { background: `var(--${selected.ref})` } : undefined;
}
