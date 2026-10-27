import { travelEstimate } from '../../../shared/lib/geo.ts';
import type { GeoPoint } from '../../../shared/lib/geo.ts';
import type {
  Away, CategoryCode, DestinationDetail, DestinationSummary, GuideLayout, GuideSectionView, PhotoView, PlaceView, SlotCode, VerdictCode,
} from './Catalog.types.ts';
import { CATEGORY_NAME, VERDICT_LABEL } from './discover.const.ts';
import type { RawDestination, RawGuideSection, RawPhoto, RawPlace, RawReference } from './CatalogRaw.types.ts';

/** Đường dẫn công khai của ảnh kho biên tập (ADR-010). */
export const PHOTO_BASE_URL = '/catalog/photos/';

/** Số ảnh xem trước tối đa trong tóm tắt điểm đến (khớp backend). */
const PREVIEW_COUNT = 3;


/** Đổi ảnh thô sang ảnh có đường dẫn công khai. */
function toPhoto(p: RawPhoto): PhotoView {
  return { url: PHOTO_BASE_URL + p.file, author: p.author, license: p.license, sourceUrl: p.sourceUrl };
}

/** Điểm tọa độ của địa điểm, hoặc null nếu địa điểm chưa có tọa độ. */
function pointOf(p: RawPlace): GeoPoint | null {
  return p.lat == null || p.lon == null ? null : { lat: p.lat, lon: p.lon };
}

/** "Cách bao xa" từ mọi mốc tham chiếu, theo thứ tự mốc trong dữ liệu (mốc đầu là mốc chính). */
function awayList(refs: readonly RawReference[], p: RawPlace): Away[] {
  const here = pointOf(p);
  if (!here) return [];
  return refs.map((r) => {
    const t = travelEstimate(r, here);
    return { refId: r.id, refName: r.name, km: t.km, minutes: t.minutes, approximate: r.approximate };
  });
}

/** Đổi địa điểm thô sang dạng API. */
function toPlace(refs: readonly RawReference[], p: RawPlace): PlaceView {
  const category = p.category as CategoryCode;
  const verdict = p.verdict as VerdictCode;
  return {
    id: p.id, name: p.name, category, categoryName: CATEGORY_NAME[category], area: p.area, hook: p.hook, summary: p.summary,
    lat: p.lat ?? null, lon: p.lon ?? null, bestMonths: p.bestMonths, bestLabel: p.bestLabel, duration: p.duration, difficulty: p.difficulty,
    highlights: p.highlights, verdict, verdictLabel: VERDICT_LABEL[verdict], verdictReason: p.verdictReason,
    bestSlots: p.bestSlots as SlotCode[], slotReason: p.slotReason, tips: p.tips, photos: p.photos.map(toPhoto),
    away: awayList(refs, p), wikipediaTitle: p.wikipediaTitle ?? null,
  };
}

/** Đổi khối cẩm nang thô sang dạng API (bố cục chữ thường, trường thiếu thành mảng rỗng). */
function toGuide(g: RawGuideSection): GuideSectionView {
  return {
    id: g.id, layout: g.layout.toLowerCase() as GuideLayout, category: g.category as CategoryCode, icon: g.icon, title: g.title, summary: g.summary,
    bestMonths: g.bestMonths ?? [], rainyMonths: g.rainyMonths ?? [], notes: g.notes ?? [],
    items: (g.items ?? []).map((i) => ({ icon: i.icon ?? '', title: i.title, text: i.text ?? '', placeId: i.placeId ?? null })),
  };
}

/** Ảnh bìa của điểm đến: ảnh đầu của địa điểm bìa. */
function coverUrlOf(d: RawDestination): string {
  const cover = d.places.find((p) => p.id === d.coverPlaceId) ?? d.places[0];
  const file = cover?.photos[0]?.file ?? '';
  return PHOTO_BASE_URL + file;
}

/** Đổi điểm đến thô sang đúng hình dạng `DestinationDetail` mà backend trả. */
export function toDestinationDetail(d: RawDestination): DestinationDetail {
  return {
    id: d.id, name: d.name, region: d.region, tagline: d.tagline, coverUrl: coverUrlOf(d),
    references: d.references.map((r) => ({ id: r.id, name: r.name, approximate: r.approximate, lat: r.lat, lon: r.lon })),
    guide: d.guide.map(toGuide), places: d.places.map((p) => toPlace(d.references, p)),
  };
}

/** Tóm tắt điểm đến cho tìm kiếm và danh sách. */
export function toDestinationSummary(d: RawDestination): DestinationSummary {
  const months = d.guide.find((g) => g.layout === 'MONTHS')?.bestMonths ?? [];
  const previews = d.places.slice(0, PREVIEW_COUNT).map((p) => ({ placeId: p.id, name: p.name, url: PHOTO_BASE_URL + (p.photos[0]?.file ?? '') }));
  return { id: d.id, name: d.name, region: d.region, tagline: d.tagline, placeCount: d.places.length, coverUrl: coverUrlOf(d), bestMonths: months, previews };
}
