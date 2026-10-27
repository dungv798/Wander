import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useRoute } from '../../../shared/router/hashRoute.ts';

/**
 * Nội dung thêm của tờ chi tiết do màn gọi truyền vào (ví dụ chuyến đi: tóm tắt mục + nút "Chọn ngày"). Tính năng khám phá
 * không biết gì về chuyến đi; chỉ hiện các nút do nơi mở cung cấp.
 */
export interface PlaceSlot {
  /** Hiện ngay dưới tên địa điểm. */
  readonly extra?: ReactNode;
  /** Thanh nút cuối tờ; thay cho "Bỏ qua/Chọn nơi này" mặc định. */
  readonly cta?: ReactNode;
  /** Tắt cặp nút "Bỏ qua/Chọn nơi này" mặc định (ví dụ đang thêm vào chuyến, bộ thẻ có nút riêng). */
  readonly noDecide?: boolean;
}

interface PlaceSheetApi {
  /** Mã địa điểm đang mở trong tờ chi tiết; null = đóng. */
  readonly placeId: string | null;
  readonly slot: PlaceSlot | null;
  /** Mở (hoặc đổi sang) chi tiết một địa điểm, tùy chọn kèm nội dung thêm. */
  readonly open: (id: string, slot?: PlaceSlot) => void;
  /** Đóng tờ chi tiết. */
  readonly close: () => void;
}

const PlaceSheetContext = createContext<PlaceSheetApi | null>(null);

/** Giữ trạng thái "đang xem chi tiết địa điểm nào" để mọi màn (trang chủ, quẹt, đã chọn, chuyến đi) mở cùng một tờ. Tờ thuộc về màn đã mở nó. */
export function PlaceSheetProvider({ children }: { readonly children: ReactNode }) {
  const route = useRoute();
  const routeKey = `${route.view}|${route.id ?? ''}|${route.sub ?? ''}`;
  const [opened, setOpened] = useState<{ id: string; key: string; slot: PlaceSlot | null } | null>(null);
  if (opened && opened.key !== routeKey) setOpened(null); // quên hẳn khi rời màn, để quay lại không tự mở lại
  const placeId = opened && opened.key === routeKey ? opened.id : null;
  const open = useCallback(
    /** Mở chi tiết địa điểm theo mã, gắn với màn hiện tại. */
    (id: string, slot?: PlaceSlot) => setOpened({ id, key: routeKey, slot: slot ?? null }),
    [routeKey],
  );
  const close = useCallback(
    /** Đóng chi tiết. */
    () => setOpened(null),
    [],
  );
  const value = useMemo(() => ({ placeId, slot: opened?.slot ?? null, open, close }), [placeId, opened, open, close]);
  return <PlaceSheetContext.Provider value={value}>{children}</PlaceSheetContext.Provider>;
}

/** Truy cập tờ chi tiết địa điểm; ném lỗi nếu quên bọc `PlaceSheetProvider`. */
export function usePlaceSheet(): PlaceSheetApi {
  const ctx = useContext(PlaceSheetContext);
  if (!ctx) throw new Error('usePlaceSheet phải nằm trong PlaceSheetProvider');
  return ctx;
}
