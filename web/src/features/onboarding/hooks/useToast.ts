import { useEffect, useState } from 'react';
import { TOAST_MS } from '../model/onboarding.const.ts';

/** A short notice that turns off by itself after `TOAST_MS`: returns the current content (null = none) and the function that shows a new notice. */
export function useToast(): { readonly toast: string | null; readonly show: (text: string) => void } {
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (toast === null) return undefined;
    const timer = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);
  return { toast, show: setToast };
}
