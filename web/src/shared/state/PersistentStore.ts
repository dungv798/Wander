/** Nơi lưu trữ khóa-giá trị (localStorage ở trình duyệt, bản giả trong test): nguyên lý D của SOLID. */
export interface KeyValueStorage {
  /** Đọc giá trị của khóa; null nếu chưa có hoặc không đọc được. */
  getItem(key: string): string | null;
  /** Ghi giá trị; có thể ném lỗi khi hết dung lượng hoặc bị chặn. */
  setItem(key: string, value: string): void;
}

/** Nơi lưu mặc định: localStorage của trình duyệt, hoặc null khi bị chặn (chế độ riêng tư, thumbnail). */
export function browserStorage(): KeyValueStorage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

/** Biến dữ liệu đọc từ nơi lưu (không tin cậy: có thể hỏng, cũ hoặc do người dùng sửa tay) thành trạng thái hợp lệ; trả `null` nếu không cứu được. */
export type Sanitizer<T> = (raw: unknown) => T | null;

/**
 * Kho trạng thái nhỏ có lưu trữ, tương thích `useSyncExternalStore` (một nguồn sự thật cho mỗi loại dữ liệu, chuẩn FE §6).
 * Trạng thái bất biến: mỗi lần đổi tạo đối tượng mới. Dữ liệu đã lưu LUÔN qua `sanitize` trước khi dùng; hỏng thì rơi về mặc định
 * để ứng dụng không trắng trang vì một khóa localStorage sai. Có thay đổi từ tab khác thì nạp lại (không ghi đè lên nhau).
 */
export class PersistentStore<T extends object> {
  private state: T;
  private readonly listeners = new Set<() => void>();
  private readonly key: string;
  private readonly initial: T;
  private readonly storage: KeyValueStorage | null;
  private readonly sanitize: Sanitizer<T>;

  /** Tạo kho với trạng thái mặc định và bộ làm sạch; nạp giá trị đã lưu và lắng nghe tab khác. */
  constructor(key: string, initial: T, sanitize: Sanitizer<T>, storage: KeyValueStorage | null = browserStorage()) {
    this.key = key;
    this.initial = initial;
    this.sanitize = sanitize;
    this.storage = storage;
    this.state = this.read();
  }

  /** Đọc và làm sạch giá trị đã lưu; mọi lỗi (JSON hỏng, kiểu sai, bị chặn) trả về mặc định. */
  private read(): T {
    try {
      const raw = this.storage?.getItem(this.key);
      return (raw ? this.sanitize(JSON.parse(raw)) : null) ?? this.initial;
    } catch {
      return this.initial;
    }
  }

  /** Tab khác đổi đúng khóa này: nạp lại để không ghi đè lên thay đổi của tab đó. */
  private readonly onStorage = (e: StorageEvent): void => {
    if (e.key !== this.key) return;
    this.state = this.read();
    this.listeners.forEach((l) => l());
  };

  /** Ảnh chụp trạng thái hiện tại (tham chiếu ổn định giữa hai lần đổi, đúng yêu cầu của `useSyncExternalStore`). */
  getSnapshot = (): T => this.state;

  /** Đăng ký nghe thay đổi; trả hàm hủy đăng ký. */
  subscribe = (listener: () => void): (() => void) => {
    // chỉ nghe tab khác khi có người đăng ký (không để lại bộ nghe mồ côi khi kho bị bỏ, ví dụ StrictMode dựng hai lần)
    if (!this.listeners.size && typeof window !== 'undefined') window.addEventListener('storage', this.onStorage);
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
      if (!this.listeners.size && typeof window !== 'undefined') window.removeEventListener('storage', this.onStorage);
    };
  };

  /** Cập nhật trạng thái bằng hàm thuần (nhận trạng thái cũ, trả trạng thái mới), lưu rồi báo cho người nghe. */
  update(change: (current: T) => T): void {
    this.state = change(this.state);
    try {
      this.storage?.setItem(this.key, JSON.stringify(this.state));
    } catch {
      /* chạy không lưu: thiết bị đầy hoặc chặn lưu trữ */
    }
    this.listeners.forEach((l) => l());
  }
}
