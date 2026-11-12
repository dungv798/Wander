import { fill } from '../../../shared/const/copy.vi.ts';
import { IconButton } from '../../../shared/ui/IconButton.tsx';
import { onboardPhotoUrl } from '../model/onboardPhotos.ts';
import type { PlaceView } from '../../discover/index.ts';
import type { FlyingChip } from '../hooks/useSelectedTray.ts';
import { ONBOARD_COPY as T } from '../model/onboarding.copy.ts';
import type { LitButton } from '../model/swipeDemo.ts';
import type { SwipeKind } from '../model/swipeDeck.ts';

interface SwipeControlsProps {
  readonly lit: LitButton;
  readonly hint: string;
  readonly onAct: (kind: SwipeKind) => void;
}

/** Two buttons, X (skip) and a check (choose), equivalent to swiping, with the same hint line; the pressed button lights up in sync with the demo round. */
export function SwipeControls({ lit, hint, onAct }: SwipeControlsProps) {
  return (
    <div className="ob-controls">
      <div className="ob-swipebtns">
        <IconButton icon="x" className={`ob-rb skip${lit === 'skip' || lit === 'both' ? ' lit' : ''}`} label={T.swipe.skipAction} onClick={() => onAct('skip')} />
        <IconButton icon="check" className={`ob-rb pick${lit === 'pick' || lit === 'both' ? ' lit' : ''}`} label={T.swipe.pick} onClick={() => onAct('pick')} />
      </div>
      <p className="ob-hint">{hint}</p>
    </div>
  );
}

interface SelectedTrayViewProps {
  readonly thumbs: readonly PlaceView[];
  readonly chips: readonly FlyingChip[];
  readonly onLanded: (id: number) => void;
}

/** The 'selected' tray: the shrunken photos that have landed, the counter, and the photos flying down from the card just chosen. */
export function SelectedTrayView({ thumbs, chips, onLanded }: SelectedTrayViewProps) {
  return (
    <>
      <div className="ob-thumbs" role="list" aria-label={T.swipe.selectedList}>
        {thumbs.map((p) => (
          <i key={p.id} role="listitem" style={{ backgroundImage: `url(${onboardPhotoUrl(p)})` }} />
        ))}
      </div>
      <p key={thumbs.length} className="ob-counter" role="status">
        {fill(T.swipe.selected, { n: thumbs.length })}
      </p>
      {chips.map((c) => (
        <i key={c.id} className="ob-chip" style={{ backgroundImage: `url(${onboardPhotoUrl(c.place)})`, '--fx': `${c.fx}px`, '--fy': `${c.fy}px`, '--tx': `${c.tx}px`, '--ty': `${c.ty}px` } as React.CSSProperties} onAnimationEnd={() => onLanded(c.id)} />
      ))}
    </>
  );
}
