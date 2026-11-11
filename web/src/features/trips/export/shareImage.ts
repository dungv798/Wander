import type { PngFile } from './Export.types.ts';
import { PNG } from './export.const.ts';

/** Phần của `navigator` mà chia sẻ ảnh cần (Web Share cấp 2); tách ra để kiểm thử mà không cần trình duyệt. */
export interface ShareNavigator {
  readonly share?: (data: ShareData) => Promise<void>;
  readonly canShare?: (data: ShareData) => boolean;
}

/** Kết quả mở bảng chia sẻ: đã gửi, người dùng đóng bảng (không phải lỗi), hoặc không mở/gửi được. */
export type ShareOutcome = 'shared' | 'cancelled' | 'failed';

/** `navigator` hiện tại của môi trường chạy; undefined khi không có (máy chủ, kiểm thử). */
function currentNavigator(): ShareNavigator | undefined {
  return typeof navigator === 'undefined' ? undefined : navigator;
}

/** Bọc blob của ảnh đã vẽ thành `File` để đưa vào bảng chia sẻ; tạo sẵn khi ảnh xong để lúc bấm nút gọi `share` ngay trong cử chỉ người dùng. */
export function pngToFile(file: PngFile): File {
  return new File([file.blob], file.filename, { type: PNG.mime });
}

/** Hệ thống có chia sẻ được các tệp này bằng bảng chia sẻ không (Safari iPhone, Chrome Android có; máy tính thường không). Lỗi từ `canShare` coi như không. */
export function canShareFiles(files: readonly File[], nav: ShareNavigator | undefined = currentNavigator()): boolean {
  if (!nav || typeof nav.share !== 'function' || typeof nav.canShare !== 'function') return false;
  try {
    return nav.canShare({ files: [...files] });
  } catch {
    return false;
  }
}

/** Mở bảng chia sẻ của hệ thống cho một ảnh. Phải gọi trực tiếp trong xử lý bấm nút; đóng bảng không phải lỗi. */
export async function shareFile(file: File, title: string, nav: ShareNavigator | undefined = currentNavigator()): Promise<ShareOutcome> {
  if (!nav || typeof nav.share !== 'function') return 'failed';
  try {
    await nav.share({ files: [file], title });
    return 'shared';
  } catch (error) {
    return error instanceof DOMException && error.name === 'AbortError' ? 'cancelled' : 'failed';
  }
}
