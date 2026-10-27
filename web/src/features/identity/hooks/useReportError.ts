import { useCallback } from 'react';
import { describeError } from '../../../shared/api/describeError.ts';
import { useToast } from '../../../shared/ui/Toast.tsx';

/** Hàm báo một lỗi API cho người dùng bằng thông báo nổi: tiêu đề + lời nhắc tiếng Việt của mã lỗi (không bao giờ lộ chữ lỗi thô). */
export function useReportError(): (error: unknown) => void {
  const toast = useToast();
  return useCallback(
    (error: unknown): void => {
      const d = describeError(error);
      toast.show(`${d.title}. ${d.text}`);
    },
    [toast],
  );
}
