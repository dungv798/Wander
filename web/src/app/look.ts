import { LOOK } from '../shared/const/look.const.ts';

/** URL ngoài hash được ưu tiên; cờ thử cũ và giá trị lạ không bật giao diện cũ. */
export function readClassicLook(location: Pick<Location, 'search' | 'hash'>, storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null): boolean {
  const query = new URLSearchParams(location.search);
  const hashQuery = new URLSearchParams(location.hash.split('?')[1] ?? '');
  const requested = query.get(LOOK.PARAM) ?? hashQuery.get(LOOK.PARAM);
  try {
    if (requested === LOOK.OFF) storage?.removeItem(LOOK.STORAGE);
    if (requested === LOOK.CLASSIC) storage?.setItem(LOOK.STORAGE, LOOK.CLASSIC);
    if (requested !== null) return requested === LOOK.CLASSIC;
    return storage?.getItem(LOOK.STORAGE) === LOOK.CLASSIC;
  } catch {
    return requested === LOOK.CLASSIC;
  }
}

/** Đặt chế độ trước lần render đầu; chỉ tải CSS và font cũ khi PO chọn classic. */
export function initializeLook(): void {
  // Chạy trước React; giữ chuỗi classic và removeItem khi URL tắt chế độ cũ.
  // PersistentStore chưa có cổng xóa khóa, nên giữ truy cập này để tương thích dữ liệu cũ.
  let storage: Storage | null = null;
  try { storage = window.localStorage; } catch { /* URL vẫn hoạt động khi kho bị chặn. */ }
  if (!readClassicLook(window.location, storage)) return;
  document.documentElement.dataset.look = LOOK.CLASSIC;
  void import('../styles/classic.css').catch(() => {
    delete document.documentElement.dataset.look;
  });
}
