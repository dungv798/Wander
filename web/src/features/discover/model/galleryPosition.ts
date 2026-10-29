/** Kẹp ảnh trong bộ ảnh; bộ rỗng vẫn trả 0 để không truy cập chỉ số âm. */
export function galleryIndex(index: number, count: number): number {
  return Math.max(0, Math.min(Math.max(0, count - 1), index));
}

/** Suy ảnh gần nhất từ vị trí cuộn theo chiều rộng khung; khung chưa đo thì về ảnh đầu. */
export function galleryIndexAt(scrollLeft: number, width: number, count: number): number {
  return width > 0 ? galleryIndex(Math.round(scrollLeft / width), count) : 0;
}
