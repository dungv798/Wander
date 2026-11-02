import { useState } from 'react';
import { fill } from '../../../shared/const/copy.vi.ts';
import { safeHttpUrl } from '../../../shared/lib/safeUrl.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { Icon } from '../../../shared/ui/Icon.tsx';
import { Sheet } from '../../../shared/ui/Sheet.tsx';
import { useTripView } from '../hooks/TripViewContext.tsx';
import { useTrips } from '../hooks/TripsProvider.tsx';
import { useUndoable } from '../hooks/useUndoable.ts';
import { COVER, COVER_GRADIENTS } from '../model/cover.const.ts';
import { COVER_COPY as C } from '../model/cover.copy.ts';
import { coverPhotos } from '../model/cover.ts';
import type { TripCover } from '../model/trip.types.ts';

/** Tờ chọn bìa từ catalog chuyến, sáu gradient hoặc tự động; chỉ Organizer được mở. */
export function CoverSheet({ onClose }: { readonly onClose: () => void }) {
  const { trip, cat } = useTripView();
  const { actions } = useTrips();
  const undoable = useUndoable();
  const [selected, setSelected] = useState<TripCover | null>(trip.cover ?? null);
  const photos = coverPhotos(cat.dest);
  /** Đóng tờ ngay để thấy bìa lạc quan; thông báo Hoàn tác chỉ hiện sau khi máy chủ ghi thành công. */
  const save = (): void => {
    onClose();
    undoable(trip.id, () => actions.updateCover(trip.id, selected), C.changed);
  };
  if (trip.role !== 'organizer') return null;
  return (
    <Sheet label={C.title} onClose={onClose}>
      <div className="trip-cover-sheet stack">
        <h2>{C.title}</h2>
        <p className="note">{C.hint}</p>
        <button type="button" className="trip-cover-auto" aria-label={C.auto} aria-pressed={selected === null} onClick={() => setSelected(null)}>
          <span><b>{C.auto}</b><small>{C.automaticHint}</small></span>
          {selected === null ? <Icon name="check" /> : null}
        </button>
        <h3>{C.photos}</h3>
        <div className="trip-cover-grid" role="group" aria-label={C.photos}>
          {photos.map((photo, index) => (
            <button type="button" className="trip-cover-choice" key={photo.ref} aria-label={fill(C.photo, { n: index + 1, place: photo.place })} aria-pressed={selected?.kind === 'photo' && selected.ref === photo.ref} onClick={() => setSelected({ kind: 'photo', ref: photo.ref })}>
              <img src={photo.url} alt="" width={COVER.thumbnail} height={COVER.thumbnail} loading="lazy" />
              {selected?.kind === 'photo' && selected.ref === photo.ref ? <span className="trip-cover-check"><Icon name="check" /></span> : null}
            </button>
          ))}
        </div>
        <h3>{C.gradients}</h3>
        <div className="trip-cover-grid" role="group" aria-label={C.gradients}>
          {COVER_GRADIENTS.map(gradient => (
            <button type="button" className="trip-cover-choice" key={gradient.ref} style={{ background: `var(--${gradient.ref})` }} aria-label={gradient.label} aria-pressed={selected?.kind === 'gradient' && selected.ref === gradient.ref} onClick={() => setSelected({ kind: 'gradient', ref: gradient.ref })}>
              {selected?.kind === 'gradient' && selected.ref === gradient.ref ? <span className="trip-cover-check"><Icon name="check" /></span> : null}
            </button>
          ))}
        </div>
        <details className="trip-cover-credits"><summary>{C.credits}</summary>{photos.map(photo => <a key={photo.ref} href={safeHttpUrl(photo.sourceUrl)} target="_blank" rel="noopener noreferrer">{fill(C.credit, { author: photo.author, license: photo.license })}</a>)}</details>
        <Button block onClick={save}>{C.save}</Button>
        <Button kind="ghost" block onClick={onClose}>{C.cancel}</Button>
      </div>
    </Sheet>
  );
}
