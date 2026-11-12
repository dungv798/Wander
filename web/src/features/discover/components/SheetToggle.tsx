import { COPY } from '../../../shared/const/copy.vi.ts';
import { Icon } from '../../../shared/ui/Icon.tsx';
import { useSheetDrag } from '../hooks/useSheetDrag.ts';
import type { SheetDragMode } from '../model/sheetDrag.ts';

interface SheetToggleProps {
  readonly mode: SheetDragMode;
  readonly onChange: (mode: SheetDragMode) => void;
}

/**
 * The handle on the top edge of the content sheet (phone only): drag down to collapse the sheet and see a wider map, drag up to open it again; tapping also toggles the state
 * (for the keyboard and screen readers).
 */
export function SheetToggle({ mode, onChange }: SheetToggleProps) {
  const handlers = useSheetDrag(mode, onChange);
  return (
    <button
      className="sheet-toggle"
      type="button"
      aria-expanded={mode === 'open'}
      aria-label={mode === 'open' ? COPY.map.sheetCollapse : COPY.map.sheetExpand}
      onClick={() => onChange(mode === 'open' ? 'peek' : 'open')}
      {...handlers}
    >
      <Icon name="chevron-down" />
    </button>
  );
}
