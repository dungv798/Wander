import { useEffect, useRef } from 'react';

/** A ref for a title: when the element enters the screen it receives focus (keyboard/screen-reader users know the content changed). The title needs `tabIndex={-1}`. */
export function useFocusOnMount<T extends HTMLElement>(): React.RefObject<T | null> {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);
  return ref;
}
