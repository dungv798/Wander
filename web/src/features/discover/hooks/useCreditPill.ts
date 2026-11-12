import { useEffect, useState } from 'react';

/** How long the photo-source label shows before hiding by itself, ms. */
const CREDIT_PILL_MS = 6000;

/**
 * The show/hide state of the photo-source label. The label is tied to the photo being viewed (`photoKey`): when the photo changes the label counts as closed
 * (no need to reset the state in an effect), and hides itself after 6 seconds.
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
