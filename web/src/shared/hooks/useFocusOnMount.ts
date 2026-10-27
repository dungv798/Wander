import { useEffect, useRef } from 'react';

/** Ref cho một tiêu đề: khi phần tử vào màn thì nhận focus (người dùng bàn phím/trình đọc màn hình biết nội dung đã đổi). Tiêu đề cần `tabIndex={-1}`. */
export function useFocusOnMount<T extends HTMLElement>(): React.RefObject<T | null> {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);
  return ref;
}
