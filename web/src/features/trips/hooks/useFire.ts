import { useCallback } from 'react';
import { useReportError } from '../../identity/index.ts';

/** Chạy một thao tác bất đồng bộ không cần chờ kết quả ("bắn rồi quên"); thất bại thì báo lỗi tiếng Việt cho người dùng thay vì để lỗi trôi. */
export function useFire(): (work: Promise<unknown>) => void {
  const report = useReportError();
  return useCallback((work) => void work.catch(report), [report]);
}
