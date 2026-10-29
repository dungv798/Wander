import { useEffect } from 'react';
import { useToast } from '../../../shared/ui/Toast.tsx';

/**
 * Thu thông báo thuần thông tin khi người dùng bắt đầu thao tác. Thông báo có nút hành động (như Hoàn tác, D19)
 * giữ nguyên tới hết thời gian của nó, nếu không người dùng chạm sang chỗ khác là mất cơ hội hoàn tác.
 */
export function useTripToast(): void {
  const { dismiss } = useToast();
  useEffect(() => {
    /** Không đóng khi người dùng đang chọn nội dung hay nút trong thông báo, hoặc thông báo có nút hành động. */
    const interact = (event: Event): void => {
      if (!(event.target instanceof Element) || event.target.closest('.toast')) return;
      if (document.querySelector('.toast button')) return;
      dismiss();
    };
    document.addEventListener('pointerdown', interact, true);
    document.addEventListener('keydown', interact, true);
    return () => {
      document.removeEventListener('pointerdown', interact, true);
      document.removeEventListener('keydown', interact, true);
    };
  }, [dismiss]);
}
