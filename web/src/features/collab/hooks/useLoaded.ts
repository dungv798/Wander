import { useCallback, useEffect, useState } from 'react';

/** Kết quả của `useLoaded`: dữ liệu mới nhất (giữ bản cũ khi đang nạp lại), lỗi nạp gần nhất và hàm nạp lại. */
export interface Loaded<T> {
  readonly data: T | null;
  readonly error: unknown;
  readonly reload: () => void;
}

/**
 * Nạp một danh sách từ máy chủ khi `deps` đổi và khi gọi `reload()`. Khác `useResource`: GIỮ dữ liệu cũ trong lúc nạp lại nên danh sách không
 * nhấp nháy sau mỗi thao tác. Kết quả của lần nạp cũ bị bỏ khi có lần nạp mới hoặc màn bị gỡ.
 */
export function useLoaded<T>(load: () => Promise<T>, deps: readonly unknown[]): Loaded<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [round, setRound] = useState(0);

  useEffect(() => {
    let live = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tham số đổi (ví dụ sang chuyến khác) thì bỏ dữ liệu của tham số cũ
    setData(null);
    load().then((value) => {
      if (!live) return;
      setData(value);
      setError(null);
    }).catch((e: unknown) => {
      if (live) setError(e);
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `deps` do người gọi khai báo có chủ đích
  }, [...deps, round]);

  useEffect(() => {
    const onVisible = (): void => {
      if (document.visibilityState === 'visible') setRound((n) => n + 1);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  const reload = useCallback(
    /** Nạp lại (sau một thao tác ghi). */
    () => setRound((n) => n + 1),
    [],
  );
  return { data, error, reload };
}
