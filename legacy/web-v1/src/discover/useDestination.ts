import { useEffect, useState } from 'react';
import { api, errorText } from '../api';
import type { DestinationDetail } from '../api';

const cache = new Map<string, DestinationDetail>();

/** Tải điểm đến (kèm địa điểm và cẩm nang) một lần cho mỗi phiên trang; nội dung biên tập bất biến nên cache an toàn. */
export function useDestination(id: string | null): { data: DestinationDetail | null; error: string | null } {
  const [data, setData] = useState<DestinationDetail | null>(id ? (cache.get(id) ?? null) : null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!id) return;
    const hit = cache.get(id);
    if (hit) {
      setData(hit);
      return;
    }
    let alive = true;
    api
      .getDestination(id)
      .then((r) => {
        cache.set(id, r.destination);
        if (alive) setData(r.destination);
      })
      .catch((e: unknown) => {
        if (alive) setError(errorText(e));
      });
    return () => {
      alive = false;
    };
  }, [id]);
  return { data, error };
}
