import { useEffect, useState } from 'react';

/** Thời gian hiện nhãn nguồn ảnh trước khi tự ẩn, ms. */
const CREDIT_PILL_MS = 6000;

/**
 * Trạng thái hiện/ẩn nhãn nguồn ảnh. Nhãn gắn với ảnh đang xem (`photoKey`): đổi ảnh thì nhãn tự coi như đã đóng
 * (không cần đặt lại trạng thái trong effect), và tự ẩn sau 6 giây.
 */
export function useCreditPill(photoKey: number): { open: boolean; toggle: () => void } {
  const [openFor, setOpenFor] = useState<number | null>(null);
  const open = openFor === photoKey;
  useEffect(() => {
    if (!open) return undefined;
    const t = window.setTimeout(() => setOpenFor(null), CREDIT_PILL_MS);
    return () => window.clearTimeout(t);
  }, [open]);
  return { open, toggle: () => setOpenFor((cur) => (cur === photoKey ? null : photoKey)) };
}
