import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

/** Ô tham chiếu luôn giữ giá trị mới nhất: để chuỗi bất đồng bộ dài đọc trạng thái hiện tại mà không phải tạo lại. */
export function useLatestRef<T>(value: T): RefObject<T> {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref;
}
