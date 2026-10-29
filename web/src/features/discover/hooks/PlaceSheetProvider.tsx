import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useRoute } from '../../../shared/router/hashRoute.ts';
import { isOverlayEntry, withOverlay } from '../../../shared/router/overlayHistory.ts';
import { galleryPhotoOrigin, photoOrigin, transitionPhoto } from '../../../shared/ui/photoTransition.ts';
import type { PhotoOrigin } from '../../../shared/ui/photoTransition.ts';

/**
 * Nội dung thêm của tờ chi tiết do màn gọi truyền vào (ví dụ chuyến đi: tóm tắt mục + nút "Chọn ngày"). Tính năng khám phá
 * không biết gì về chuyến đi; chỉ hiện các nút do nơi mở cung cấp.
 */
export interface PlaceSlot {
  /** Khung ảnh ghim native do màn bản đồ cung cấp, không sửa bộ vẽ bản đồ. */
  readonly photoOrigin?: PhotoOrigin | null;
  /** Hiện ngay dưới tên địa điểm. */
  readonly extra?: ReactNode;
  /** Thanh nút cuối tờ; thay cho "Bỏ qua/Chọn nơi này" mặc định. */
  readonly cta?: ReactNode;
  /** Tắt cặp nút "Bỏ qua/Chọn nơi này" mặc định (ví dụ đang thêm vào chuyến, bộ thẻ có nút riêng). */
  readonly noDecide?: boolean;
}

interface PlaceSheetApi {
  readonly openingPhoto: string | null;
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
  const [opened, setOpened] = useState<{ id: string; key: string; photo: string | null; slot: PlaceSlot | null } | null>(null);
  const closing = useRef(false);
  const origin = useRef<PhotoOrigin | null>(null);
  /** Đóng qua cùng một đường cho Esc, nút Đóng và Back, giữ cleanup focus của Sheet. */
  const dismiss = useCallback((): void => {
    const from = galleryPhotoOrigin();
    transitionPhoto(from, () => setOpened(null), () => {
      const saved = origin.current;
      return saved?.element?.isConnected ? { ...saved, rect: saved.element.getBoundingClientRect() } : saved;
    });
  }, []);
  useEffect(() => {
    /** Back đóng tờ phủ trên cùng URL trước khi người dùng rời màn nền. */
    const popped = (): void => { closing.current = false; dismiss(); };
    window.addEventListener('popstate', popped);
    return () => window.removeEventListener('popstate', popped);
  }, [dismiss]);
  if (opened && opened.key !== routeKey) setOpened(null); // quên hẳn khi rời màn, để quay lại không tự mở lại
  const placeId = opened && opened.key === routeKey ? opened.id : null;
  const open = useCallback(
    /** Mở chi tiết địa điểm theo mã, gắn với màn hiện tại. */
    (id: string, slot?: PlaceSlot) => {
      closing.current = false;
      if (!isOverlayEntry(history.state, location.hash)) history.pushState(withOverlay(history.state, location.hash), '');
      const escaped = CSS.escape(id);
      const image = document.querySelector<HTMLImageElement>(`.card.front[data-id="${escaped}"] img, [data-place-photo="${escaped}"] img`);
      origin.current = slot?.photoOrigin ?? photoOrigin(image);
      const photo = origin.current?.url ?? null;
      transitionPhoto(origin.current, () => setOpened({ id, key: routeKey, photo, slot: slot ?? null }), galleryPhotoOrigin);
    },
    [routeKey],
  );
  const close = useCallback(
    /** Đóng chi tiết. */
    () => {
      if (closing.current) return;
      if (isOverlayEntry(history.state, location.hash)) { closing.current = true; history.back(); }
      else dismiss();
    },
    [dismiss],
  );
  const value = useMemo(() => ({ placeId, openingPhoto: opened?.photo ?? null, slot: opened?.slot ?? null, open, close }), [placeId, opened, open, close]);
  return <PlaceSheetContext.Provider value={value}>{children}</PlaceSheetContext.Provider>;
}

/** Truy cập tờ chi tiết địa điểm; ném lỗi nếu quên bọc `PlaceSheetProvider`. */
export function usePlaceSheet(): PlaceSheetApi {
  const ctx = useContext(PlaceSheetContext);
  if (!ctx) throw new Error('usePlaceSheet phải nằm trong PlaceSheetProvider');
  return ctx;
}
