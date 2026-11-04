/** Hợp đồng dữ liệu kho biên tập, khớp `CatalogViews` của backend (backend/src/main/java/com/wander/catalog/application/query). */

/** Mã loại địa điểm (`PlaceCategory`). */
export type CategoryCode = 'canh' | 'van' | 'am' | 'leo' | 'luu' | 'cho';

/** Mã nhãn biên tập thay điểm sao (`Verdict`, DR-007): ý kiến của Wander, KHÔNG phải đánh giá người dùng. */
export type VerdictCode = 'must' | 'worth' | 'ifconv';

/** Buổi nên đi (`TimeSlot`). */
export type SlotCode = 'sang' | 'trua' | 'chieu' | 'toi';

/** Kiểu bố cục của một khối cẩm nang. */
export type GuideLayout = 'months' | 'checklist' | 'cards' | 'places' | 'rows';

/** Một ảnh kèm ghi công tác giả và giấy phép (bắt buộc hiển thị). */
export interface PhotoView {
  readonly url: string;
  readonly author: string;
  readonly license: string;
  readonly sourceUrl: string;
}

/** Chủ đề đời sống được backend biên tập. */
export type MomentTheme = 'cho' | 'mon-an' | 'nguoi' | 'le-hoi' | 'nghe';

/** Ảnh không khí ở cấp điểm đến, kèm đầy đủ thông tin ghi công. */
export interface MomentView {
  readonly id: string;
  readonly theme: MomentTheme;
  readonly themeLabel: string;
  readonly caption: string;
  readonly photo: PhotoView;
}

/** "Cách bao xa" từ một mốc (ước tính đường núi, không phải chỉ đường). */
export interface Away {
  readonly refId: string;
  readonly refName: string;
  readonly km: number;
  readonly minutes: number;
  readonly approximate: boolean;
}

/** Một địa điểm trong kho biên tập. */
export interface PlaceView {
  readonly id: string;
  readonly name: string;
  readonly category: CategoryCode;
  readonly categoryName: string;
  readonly area: string;
  readonly hook: string;
  readonly summary: string;
  readonly lat: number | null;
  readonly lon: number | null;
  readonly bestMonths: readonly number[];
  readonly bestLabel: string;
  readonly duration: string;
  readonly difficulty: string;
  readonly highlights: readonly string[];
  readonly verdict: VerdictCode;
  readonly verdictLabel: string;
  readonly verdictReason: string;
  readonly bestSlots: readonly SlotCode[];
  readonly slotReason: string;
  readonly tips: readonly string[];
  readonly photos: readonly PhotoView[];
  readonly away: readonly Away[];
  readonly wikipediaTitle: string | null;
}

/** Một mục trong khối cẩm nang (biểu tượng, tiêu đề, mô tả, tùy chọn trỏ tới địa điểm). */
export interface GuideItemView {
  readonly icon: string;
  readonly title: string;
  readonly text: string;
  readonly placeId: string | null;
}

/** Một khối cẩm nang của điểm đến. */
export interface GuideSectionView {
  readonly id: string;
  readonly layout: GuideLayout;
  readonly category: CategoryCode;
  readonly icon: string;
  readonly title: string;
  readonly summary: string;
  readonly bestMonths: readonly number[];
  readonly rainyMonths: readonly number[];
  readonly notes: readonly string[];
  readonly items: readonly GuideItemView[];
}

/** Mốc tham chiếu để tính khoảng cách (ví dụ TP Hà Giang). */
export interface ReferenceView {
  readonly id: string;
  readonly name: string;
  readonly approximate: boolean;
  /** Tọa độ mốc: CHƯA có ở backend (`ReferenceView`); kho giả điền sẵn, backend phải thêm trước khi nối (todo FE-10). */
  readonly lat?: number;
  readonly lon?: number;
}

/** Điểm đến đầy đủ: cẩm nang + mọi địa điểm. */
export interface DestinationDetail {
  readonly id: string;
  readonly name: string;
  readonly region: string;
  readonly tagline: string;
  readonly coverUrl: string;
  readonly references: readonly ReferenceView[];
  readonly guide: readonly GuideSectionView[];
  readonly places: readonly PlaceView[];
  readonly moments: readonly MomentView[];
}

/** Ảnh xem trước trong danh sách điểm đến. */
export interface Preview {
  readonly placeId: string;
  readonly name: string;
  readonly url: string;
}

/** Tóm tắt điểm đến cho danh sách và tìm kiếm. */
export interface DestinationSummary {
  readonly lat: number | null;
  readonly lon: number | null;
  readonly id: string;
  readonly name: string;
  readonly region: string;
  readonly tagline: string;
  readonly placeCount: number;
  readonly coverUrl: string;
  readonly bestMonths: readonly number[];
  readonly previews: readonly Preview[];
}
