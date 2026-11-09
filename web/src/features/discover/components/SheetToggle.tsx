import { COPY } from '../../../shared/const/copy.vi.ts';
import { Icon } from '../../../shared/ui/Icon.tsx';
import { useSheetDrag } from '../hooks/useSheetDrag.ts';
import type { SheetDragMode } from '../model/sheetDrag.ts';

interface SheetToggleProps {
  readonly mode: SheetDragMode;
  readonly onChange: (mode: SheetDragMode) => void;
}

/**
 * Tay nắm ở mép trên của tờ nội dung (chỉ điện thoại): kéo xuống để thu tờ và xem bản đồ rộng hơn, kéo lên để mở lại; bấm cũng đổi trạng thái
 * (cho bàn phím và trình đọc màn hình).
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
