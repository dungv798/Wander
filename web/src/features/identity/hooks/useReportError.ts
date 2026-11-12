import { useCallback } from 'react';
import { describeError } from '../../../shared/api/describeError.ts';
import { ERROR_CODE_LABEL } from '../../../shared/api/errorMessages.const.ts';
import { fill } from '../../../shared/const/copy.vi.ts';
import { useToast } from '../../../shared/ui/Toast.tsx';

/** Báo lỗi bằng thông báo nổi với lời nhắc tiếng Việt và nhãn mã giống hộp lỗi, không lộ nội dung lỗi thô. */
export function useReportError(): (error: unknown) => void {
  const toast = useToast();
  return useCallback(
    /** Giữ mã lỗi trong thông báo để người dùng có thể báo hỗ trợ. */
    (error: unknown): void => {
      const d = describeError(error);
      toast.error(`${d.title}. ${d.text} ${fill(ERROR_CODE_LABEL, { code: d.code })}`);
    },
    [toast],
  );
}
