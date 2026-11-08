import { COPY } from '../../../../shared/const/copy.vi.ts';
import { Icon } from '../../../../shared/ui/Icon.tsx';
import type { IconName } from '../../../../shared/ui/icons/iconPaths.const.ts';
import type { SwipeDir } from '../../model/swipeGesture.ts';

interface DeckActionsProps {
  readonly canUndo: boolean;
  readonly onUndo: () => void;
  readonly onSwipe: (dir: SwipeDir) => void;
}

interface RoundProps {
  readonly cls: string;
  readonly icon: IconName;
  readonly label: string;
  readonly caption: string;
  readonly disabled?: boolean;
  readonly onClick: () => void;
}

/** Một nút tròn của hàng hành động kèm chú thích bên dưới. */
function Round({ cls, icon, label, caption, disabled, onClick }: RoundProps) {
  return (
    <div className="act">
      <button className={`round ${cls}`} type="button" aria-label={label} disabled={disabled} onClick={onClick}>
        <Icon name={icon} />
        {cls === 'l' || cls === 'r' ? <span>{caption}</span> : null}
      </button>
    </div>
  );
}

/** Hàng nút dưới bộ thẻ: Hoàn tác, Bỏ qua, Chọn, Chi tiết (thay thế đầy đủ cho cử chỉ quẹt, a11y). */
export function DeckActions({ canUndo, onUndo, onSwipe }: DeckActionsProps) {
  return (
    <div className="actions">
      <Round cls="small" icon="arrow-back-up" label={COPY.deck.undo} caption={COPY.deck.undo} disabled={!canUndo} onClick={onUndo} />
      <Round cls="l" icon="x" label={COPY.deck.skip} caption={COPY.deck.skip} onClick={() => onSwipe('l')} />
      <Round cls="r" icon="check" label={COPY.deck.likeAria} caption={COPY.deck.like} onClick={() => onSwipe('r')} />
    </div>
  );
}
