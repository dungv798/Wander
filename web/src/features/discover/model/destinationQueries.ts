import type { CategoryCode, DestinationDetail, PhotoView, PlaceView } from './Catalog.types.ts';

/** Tháng đẹp nhất của điểm đến: lấy từ khối cẩm nang "months" (không viết cứng ở giao diện). */
export function destBestMonths(d: DestinationDetail): readonly number[] {
  return d.guide.find((g) => g.layout === 'months')?.bestMonths ?? [];
}

/** Tháng mưa nhiều của điểm đến, cùng khối "months". */
export function destRainyMonths(d: DestinationDetail): readonly number[] {
  return d.guide.find((g) => g.layout === 'months')?.rainyMonths ?? [];
}

/** Địa điểm theo mã; null nếu không có (không đoán địa điểm khác). */
export function placeById(d: DestinationDetail, id: string): PlaceView | null {
  return d.places.find((p) => p.id === id) ?? null;
}

/** Ảnh đầu của địa điểm (mọi địa điểm trong kho có ≥ 1 ảnh); chuỗi rỗng nếu thiếu. */
export function firstPhotoUrl(p: PlaceView | null | undefined): string {
  return p?.photos[0]?.url ?? '';
}

/** Ảnh thứ `i` của địa điểm, kẹp trong khoảng hợp lệ. */
export function photoAt(p: PlaceView, i: number): PhotoView | undefined {
  return p.photos[Math.max(0, Math.min(p.photos.length - 1, i))];
}

/** Các địa điểm đang vào mùa đẹp của một tháng (1–12), theo kho biên tập. */
export function placesInSeason(d: DestinationDetail, month: number): PlaceView[] {
  return d.places.filter((p) => p.bestMonths.includes(month));
}

/** Các loại có trong điểm đến theo thứ tự xuất hiện lần đầu. */
export function categoriesOf(d: DestinationDetail): CategoryCode[] {
  return [...new Set(d.places.map((p) => p.category))];
}

/** Gom địa điểm theo loại, giữ thứ tự xuất hiện của loại. */
export function groupByCategory(d: DestinationDetail): Map<CategoryCode, PlaceView[]> {
  const out = new Map<CategoryCode, PlaceView[]>();
  d.places.forEach((p) => out.set(p.category, [...(out.get(p.category) ?? []), p]));
  return out;
}

/** Khoảng cách ước tính của địa điểm tới mốc chính (mốc đầu tiên), hoặc null nếu địa điểm chưa có tọa độ. */
export function mainAway(p: PlaceView): PlaceView['away'][number] | null {
  return p.away[0] ?? null;
}

/** Địa điểm bìa của điểm đến: nơi có ảnh đầu trùng ảnh bìa (backend chỉ trả `coverUrl`, không trả mã địa điểm bìa). */
export function coverPlace(d: DestinationDetail): PlaceView | null {
  return d.places.find((p) => firstPhotoUrl(p) === d.coverUrl) ?? d.places[0] ?? null;
}
