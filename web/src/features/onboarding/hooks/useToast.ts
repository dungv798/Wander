import { useEffect, useState } from 'react';
import { TOAST_MS } from '../model/onboarding.const.ts';

/** Thông báo ngắn tự tắt sau `TOAST_MS`: trả nội dung hiện tại (null = không có) và hàm hiện thông báo mới. */
export function useToast(): { readonly toast: string | null; readonly show: (text: string) => void } {
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (toast === null) return undefined;
    const timer = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);
  return { toast, show: setToast };
}
