import { useState } from 'react';
import { fill } from '../../../shared/const/copy.vi.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { ErrorBox } from '../../../shared/ui/ErrorBox.tsx';
import { useToast } from '../../../shared/ui/Toast.tsx';
import { usePlaceRating } from '../hooks/usePlaceRating.ts';
import { RATING } from '../model/rating.const.ts';
import { RATING_COPY as C } from '../model/rating.copy.ts';
import { formatAverage, starsText } from '../model/ratingFormat.ts';
import type { PlaceRating } from '../model/rating.types.ts';
import { RatingComments } from './RatingComments.tsx';
import { RatingForm } from './RatingForm.tsx';
import '../rating.css';

/** Dòng "Wander ★ 4,5 · 7 người" hoặc lời mời chấm đầu tiên khi chưa có lượt nào. */
function SummaryRow({ data }: { readonly data: PlaceRating }) {
  const { average, count } = data.summary;
  if (average === null || count === 0) return <p className="rating-empty">{C.noneYet}</p>;
  const avg = formatAverage(average);
  return (
    <p className="rating-summary">
      <b>{C.source}</b>
      <span className="rating-stars" aria-hidden="true">{starsText(average)}</span>
      <b>{avg}</b>
      <span>· {fill(C.people, { n: count })}</span>
    </p>
  );
}

/**
 * Thẻ đánh giá Wander của một quán (DR-032): điểm tổng hợp từ người dùng Wander, "Bạn chấm" 1–5 sao kèm lời bình ngắn tùy chọn,
 * lời bình ẩn danh gần đây và nút báo cáo. Dùng với `key={placeId}`. Không có phiên trên máy này thì không hiện gì.
 */
export function PlaceRatingCard({ placeId }: { readonly placeId: string }) {
  const rating = usePlaceRating(placeId);
  const toast = useToast();
  const [open, setOpen] = useState(false);
  if (rating.status === 'off') return null;
  if (rating.status === 'loading') return <div className="rating-card" aria-busy="true"><p className="note">{C.loading}</p></div>;
  if (rating.status === 'error' || !rating.data) {
    return <div className="rating-card"><ErrorBox error={rating.error} onAction={rating.reload} /></div>;
  }
  const act = async (task: () => Promise<boolean>, message: string): Promise<void> => { if (await task()) toast.show(message); };
  const mine = rating.data.mine;
  return (
    <section className="rating-card" aria-label={C.title}>
      <h3>{C.title}</h3>
      <SummaryRow data={rating.data} />
      {open ? (
        <RatingForm key={mine?.updatedAt ?? 'new'} mine={mine} busy={rating.busy}
          onSave={(stars, comment) => void act(() => rating.save(stars, comment), C.saved)}
          onRemove={() => void act(rating.remove, C.removed)} />
      ) : mine ? <p className="note">{fill(C.mineSummary, { n: mine.stars })}</p> : null}
      {rating.error ? <ErrorBox error={rating.error} /> : null}
      <RatingComments comments={open ? rating.data.comments : rating.data.comments.slice(0, RATING.PREVIEW_COMMENTS)} busy={rating.busy} onReport={(id) => void act(() => rating.report(id), C.reported)} />
      <Button kind="ghost" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? C.collapse : mine ? C.editMine : C.writeOrAll}</Button>
    </section>
  );
}
