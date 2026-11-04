import { fill } from '../../../shared/const/copy.vi.ts';
import { Icon } from '../../../shared/ui/Icon.tsx';
import { onboardPhotoUrl } from '../model/onboardPhotos.ts';
import type { PlaceView } from '../../discover/index.ts';
import type { SwipeStory } from '../hooks/useSwipeStory.ts';
import { ONBOARD_COPY as T } from '../model/onboarding.copy.ts';
import type { Caption } from '../model/swipeDemo.ts';

/** Bản tĩnh khi giảm chuyển động: hai trạng thái chọn / bỏ qua bằng hình và chữ, không chạy hoạt họa. */
export function StaticSwipe({ places }: { readonly places: readonly PlaceView[] }) {
  const cases = [
    { kind: 'skip', place: places[1], copy: T.swipe.staticSkip, stamp: T.skipStamp },
    { kind: 'pick', place: places[0], copy: T.swipe.staticPick, stamp: T.chooseStamp },
  ];
  return (
    <div className="ob-scene ob-static">
      {cases.map(({ kind, place, copy, stamp }) => (
        <div key={kind} className="ob-staticcol">
          <figure className={`ob-staticcard ${kind}`}>
            {place ? <img src={onboardPhotoUrl(place)} alt="" decoding="async" /> : null}
            <span className={`ob-stamp ${kind}`}>{stamp}</span>
            <figcaption>{place?.name}</figcaption>
          </figure>
          <p>
            <strong>{copy.title}</strong>
            {copy.text}
          </p>
        </div>
      ))}
    </div>
  );
}

/** Tổng kết khi người xem tự quẹt hết bộ bài: các nơi đã chọn và lời mời xem lịch mẫu (lịch không phụ thuộc lựa chọn của họ). */
export function DeckDone({ picks }: { readonly picks: readonly PlaceView[] }) {
  return (
    <div className="ob-done">
      <div className="ob-stackrow">
        {picks.map((p) => (
          <i key={p.id} style={{ backgroundImage: `url(${onboardPhotoUrl(p)})` }} />
        ))}
      </div>
      <b>{fill(T.swipe.selected, { n: picks.length })}</b>
    </div>
  );
}

/** Chú thích nổi phía trên bộ thẻ (kèm mũi tên theo chiều quẹt). */
export function CaptionPill({ caption }: { readonly caption: Caption | null }) {
  if (!caption) return null;
  return (
    <p className={`ob-caption${caption.dir === 'l' ? ' l' : ''}${caption.dir ? '' : ' plain'}`}>
      {caption.dir ? <Icon name="chevron-left" size="s" className={caption.dir === 'r' ? 'flip' : undefined} /> : null}
      {caption.text}
    </p>
  );
}

/** Nút "Xem lại" của một cảnh; chỉ hiện khi cảnh không còn đang tự chạy. */
export function ReplayButton({ story, onClick }: { readonly story: Pick<SwipeStory, 'phase'>; readonly onClick: () => void }) {
  if (story.phase === 'playing') return null;
  return (
    <button type="button" className="ob-replay" onClick={onClick}>
      <Icon name="arrow-back-up" size="s" />
      {T.replay}
    </button>
  );
}
