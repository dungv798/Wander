/** Clamps a photo within the photo set; an empty set still returns 0 so a negative index is never accessed. */
export function galleryIndex(index: number, count: number): number {
  return Math.max(0, Math.min(Math.max(0, count - 1), index));
}

/** Derives the nearest photo from the scroll position by the frame width; an unmeasured frame gives the first photo. */
export function galleryIndexAt(scrollLeft: number, width: number, count: number): number {
  return width > 0 ? galleryIndex(Math.round(scrollLeft / width), count) : 0;
}
