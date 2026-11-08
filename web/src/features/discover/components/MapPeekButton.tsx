import { Icon } from '../../../shared/ui/Icon.tsx';
import { HOME_COPY } from '../model/home.copy.ts';
import { useShellSheet } from '../hooks/ShellSheetProvider.tsx';

/**
 * Nút "Bản đồ" đưa người dùng tới BẢN ĐỒ CHÍNH của khung ứng dụng (cùng dữ liệu, cùng camera) bằng cách thu tờ nội dung.
 * Chỉ có nghĩa ở điện thoại, nơi tờ che bản đồ; màn rộng đã thấy bản đồ cạnh bảng nên CSS ẩn nút (`.map-peek`).
 */
export function MapPeekButton() {
  const sheet = useShellSheet();
  if (!sheet) return null;
  return (
    <button className="btn ghost map-peek" type="button" onClick={() => sheet.setMode('peek')}>
      <Icon name="map-pin" />
      {HOME_COPY.mapButton}
    </button>
  );
}
