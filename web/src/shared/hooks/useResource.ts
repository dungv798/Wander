import { useCallback, useEffect, useState } from 'react';

/** Trạng thái tải hợp nhất (không dùng hai cờ lệch nhau): đang tải, lỗi hoặc sẵn sàng (chuẩn FE §2). */
export type ResourceState<T> =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly error: unknown }
  | { readonly status: 'ready'; readonly data: T };

/**
 * Tải một tài nguyên bất đồng bộ, hủy kết quả cũ khi tham số đổi hoặc màn bị gỡ (tránh ghi đè bằng yêu cầu cũ).
 * `load` nhận tín hiệu hủy; trả `retry()` để thử lại sau lỗi.
 */
export function useResource<T>(load: (signal: AbortSignal) => Promise<T>, deps: readonly unknown[]): { state: ResourceState<T>; retry: () => void } {
  const [state, setState] = useState<ResourceState<T>>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mục đích của hook: về "đang tải" ngay khi tham số đổi hoặc thử lại
    setState({ status: 'loading' });
    load(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setState({ status: 'ready', data });
      },
      (error: unknown) => {
        if (!controller.signal.aborted) setState({ status: 'error', error });
      },
    );
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `deps` do người gọi khai báo có chủ đích
  }, [...deps, attempt]);

  const retry = useCallback(
    /** Tải lại sau lỗi. */
    () => setAttempt((n) => n + 1),
    [],
  );
  return { state, retry };
}
