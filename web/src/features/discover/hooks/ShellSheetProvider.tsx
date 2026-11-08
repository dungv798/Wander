import { createContext, useContext } from 'react';

/** Chế độ tờ nội dung trên điện thoại: mở (che phần lớn bản đồ) hoặc thu lại (lộ bản đồ để kéo, phóng). */
export type SheetMode = 'open' | 'peek';

/** Giá trị chia sẻ: chế độ hiện tại và hàm đổi; `null` khi màn được dựng ngoài khung ứng dụng (test, preview). */
export interface ShellSheetValue {
  readonly mode: SheetMode;
  readonly setMode: (mode: SheetMode) => void;
}

/** Ngữ cảnh do khung ứng dụng cấp; màn trong tờ dùng để mở "bản đồ chính" mà không tự dựng bản đồ riêng. */
export const ShellSheetContext = createContext<ShellSheetValue | null>(null);

/** Đọc chế độ tờ của khung ứng dụng; `null` nếu không có khung (nút "Bản đồ" khi đó tự ẩn). */
export function useShellSheet(): ShellSheetValue | null {
  return useContext(ShellSheetContext);
}
