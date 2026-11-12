import { useEffect } from 'react';
import { useToast } from '../../../shared/ui/Toast.tsx';

/**
 * Collects a purely informational notice when the user starts acting. A notice with an action button (like Undo, D19)
 * stays until its own time runs out, otherwise tapping elsewhere would lose the chance to undo.
 */
export function useTripToast(): void {
  const { dismiss } = useToast();
  useEffect(() => {
    /** Does not close while the user is selecting content or a button in the notice, or when the notice has an action button. */
    const interact = (event: Event): void => {
      if (!(event.target instanceof Element) || event.target.closest('.toast')) return;
      if (document.querySelector('.toast button')) return;
      dismiss();
    };
    document.addEventListener('pointerdown', interact, true);
    document.addEventListener('keydown', interact, true);
    return () => {
      document.removeEventListener('pointerdown', interact, true);
      document.removeEventListener('keydown', interact, true);
    };
  }, [dismiss]);
}
