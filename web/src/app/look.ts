import { LOOK } from '../shared/const/look.const.ts';
import type { TrialLook } from '../shared/const/look.const.ts';

/** Chỉ chấp nhận ba bộ chữ đã có tệp cục bộ, bỏ qua giá trị URL/kho lạ. */
export function isTrialLook(value: string | null): value is TrialLook {
  return LOOK.VALUES.some((look) => look === value);
}

/** Đọc lựa chọn đúng một lần lúc nạp ứng dụng; URL ngoài hash được ưu tiên. Kho bị chặn vẫn dùng được URL. */
export function readTrialLook(location: Pick<Location, 'search' | 'hash'>, storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null): TrialLook | null {
  const query = new URLSearchParams(location.search);
  const hashQuery = new URLSearchParams(location.hash.split('?')[1] ?? '');
  const requested = query.get(LOOK.PARAM) ?? hashQuery.get(LOOK.PARAM);
  try {
    if (requested === LOOK.OFF) storage?.removeItem(LOOK.STORAGE);
    if (isTrialLook(requested)) storage?.setItem(LOOK.STORAGE, requested);
    if (requested === LOOK.OFF) return null;
    if (isTrialLook(requested)) return requested;
    const saved = storage?.getItem(LOOK.STORAGE) ?? null;
    return isTrialLook(saved) ? saved : null;
  } catch {
    return isTrialLook(requested) ? requested : null;
  }
}

/** CSS/font thử chỉ tải khi bật; lỗi tải giữ giao diện mặc định, không chặn ứng dụng. */
export async function initializeTrialLook(): Promise<void> {
  let storage: Storage | null = null;
  try { storage = window.localStorage; } catch { /* Trình duyệt có thể chặn kho cục bộ. */ }
  const look = readTrialLook(window.location, storage);
  if (!look) return;
  try {
    await import('../styles/look.css');
    document.documentElement.dataset.look = look;
  } catch { /* Thử nghiệm không được làm hỏng khởi động mặc định. */ }
}
