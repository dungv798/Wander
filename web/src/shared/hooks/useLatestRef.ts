import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

/** A reference cell that always holds the latest value: so a long asynchronous chain reads the current state without being recreated. */
export function useLatestRef<T>(value: T): RefObject<T> {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref;
}
