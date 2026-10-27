/** Hình dạng tệp kho biên tập thô (backend/src/main/resources/catalog/<id>.json). Chỉ dùng ở kho giả; sản phẩm thật nhận `DestinationDetail` từ API. */

/** Ảnh thô: tên tệp (chưa có đường dẫn) và ghi công. */
export interface RawPhoto {
  readonly file: string;
  readonly author: string;
  readonly license: string;
  readonly sourceUrl: string;
}

/** Địa điểm thô. */
export interface RawPlace {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly area: string;
  readonly hook: string;
  readonly summary: string;
  readonly lat?: number | null;
  readonly lon?: number | null;
  readonly bestMonths: readonly number[];
  readonly bestLabel: string;
  readonly duration: string;
  readonly difficulty: string;
  readonly highlights: readonly string[];
  readonly verdict: string;
  readonly verdictReason: string;
  readonly bestSlots: readonly string[];
  readonly slotReason: string;
  readonly tips: readonly string[];
  readonly photos: readonly RawPhoto[];
  readonly wikipediaTitle?: string | null;
}

/** Mục cẩm nang thô. */
export interface RawGuideItem {
  readonly icon?: string;
  readonly title: string;
  readonly text?: string;
  readonly placeId?: string;
}

/** Khối cẩm nang thô (bố cục viết HOA ở dữ liệu). */
export interface RawGuideSection {
  readonly id: string;
  readonly layout: string;
  readonly category: string;
  readonly icon: string;
  readonly title: string;
  readonly summary: string;
  readonly bestMonths?: readonly number[];
  readonly rainyMonths?: readonly number[];
  readonly notes?: readonly string[];
  readonly items?: readonly RawGuideItem[];
}

/** Mốc tham chiếu thô, có tọa độ. */
export interface RawReference {
  readonly id: string;
  readonly name: string;
  readonly lat: number;
  readonly lon: number;
  readonly approximate: boolean;
}

/** Điểm đến thô. */
export interface RawDestination {
  readonly id: string;
  readonly name: string;
  readonly region: string;
  readonly tagline: string;
  readonly coverPlaceId: string;
  readonly references: readonly RawReference[];
  readonly guide: readonly RawGuideSection[];
  readonly places: readonly RawPlace[];
}
