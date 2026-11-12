import { useEffect, useRef } from 'react';
import { COPY } from '../shared/const/copy.vi.ts';
import { Icon } from '../shared/ui/Icon.tsx';

interface MobileMapControlsProps {
  readonly open: boolean;
  readonly onToggle: () => void;
}

/** A clear switch between reading the list and working the map, with the same button that is always within reach. */
export function MobileMapControls({ open, onToggle }: MobileMapControlsProps) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return undefined;
    ref.current?.focus({ preventScroll: true });
    /** Esc closes the map mode; a dialog above it may intercept first. */
    const escape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && !event.defaultPrevented) { event.preventDefault(); onToggle(); }
    };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [open, onToggle]);
  return (
    <button ref={ref} className="mobile-map-switch" type="button" aria-pressed={open} aria-controls="screen" onClick={onToggle}>
      <Icon name={open ? 'list-check' : 'map-pin'} />
      <span>{open ? COPY.map.showList : COPY.map.showMap}</span>
    </button>
  );
}
