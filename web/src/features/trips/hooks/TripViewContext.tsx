import { createContext, useContext } from 'react';
import type { ItemKind, Trip } from '../model/trip.types.ts';
import type { TripCatalog } from '../model/tripView.ts';
import type { MealGap } from '../model/mealGaps.ts';

/** Tờ phủ đang mở trên màn chuyến đi (chỉ một cái một lúc). */
export type Overlay =
  | { readonly kind: 'mealSuggest'; readonly day: string; readonly gap: MealGap }
  | { readonly kind: 'add' }
  | { readonly kind: 'editor'; readonly itemId: string | null; readonly preset: ItemKind | null }
  | { readonly kind: 'editTrip' }
  | { readonly kind: 'cover' }
  | { readonly kind: 'plan' }
  | { readonly kind: 'addToDay' }
  | { readonly kind: 'pickDay'; readonly itemId: string }
  | { readonly kind: 'trash' }
  | { readonly kind: 'deleteTrip' }
  | { readonly kind: 'people' }
  | { readonly kind: 'requests' }
  | { readonly kind: 'requestDelete'; readonly itemId: string };

/** Mọi thứ các thành phần con của màn chuyến đi cần: dữ liệu chuyến + điểm đến, tab, tờ phủ, chế độ sắp xếp và các hành động chung. */
export interface TripViewValue {
  readonly trip: Trip;
  readonly cat: TripCatalog;
  /** Mọi ngày của chuyến theo thứ tự. */
  readonly days: readonly string[];
  /** `ov` (tổng quan) hoặc số ngày 1..n dạng chuỗi. */
  readonly tab: string;
  readonly setTab: (tab: string) => void;
  readonly setOverlay: (o: Overlay | null) => void;
  readonly sorting: boolean;
  readonly setSorting: (v: boolean) => void;
  /** Mở một mục: địa điểm → tờ chi tiết kèm nút của chuyến; mục tự do → trình sửa. */
  readonly openItem: (itemId: string) => void;
  /** Sang bộ thẻ để thêm địa điểm vào chuyến này. */
  readonly addMore: () => void;
  /** Đọc to một thông báo cho trình đọc màn hình. */
  readonly announce: (text: string) => void;
}

const TripViewContext = createContext<TripViewValue | null>(null);

/** Nhà cung cấp ngữ cảnh màn chuyến đi. */
export const TripViewProvider = TripViewContext.Provider;

/** Truy cập ngữ cảnh màn chuyến đi; ném lỗi nếu dùng ngoài `TripViewProvider`. */
export function useTripView(): TripViewValue {
  const ctx = useContext(TripViewContext);
  if (!ctx) throw new Error('useTripView phải nằm trong TripViewProvider');
  return ctx;
}
