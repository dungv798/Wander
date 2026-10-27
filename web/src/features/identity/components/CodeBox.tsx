import { useEffect, useState } from 'react';
import type { RecoveryCode } from '../../../shared/domain/RecoveryCode.ts';

/** Có đang ẩn tab/cửa sổ không (mã được làm mờ để ảnh chụp chuyển tab, ảnh xem trước không lộ mã). */
function useDocumentHidden(): boolean {
  const [hidden, setHidden] = useState(() => document.hidden);
  useEffect(() => {
    /** Cập nhật cờ khi tab hiện/ẩn. */
    const onChange = (): void => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);
  return hidden;
}

/** Hộp hiện mã khôi phục: 6 nhóm × 5 ký hiệu (3 nhóm mỗi hàng), mờ đi khi tab bị ẩn. `label` là nhãn cho trình đọc màn hình. */
export function CodeBox({ code, label }: { readonly code: RecoveryCode; readonly label: string }) {
  const hidden = useDocumentHidden();
  return (
    <div className={hidden ? 'codebox blur' : 'codebox'} role="group" aria-label={label}>
      {code.groups.map((g, k) => (
        <span key={`${k}-${g}`}>{g}</span>
      ))}
    </div>
  );
}
