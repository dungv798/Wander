import { Button } from '../../../shared/ui/Button.tsx';
import { fill } from '../../../shared/const/copy.vi.ts';
import { RATING_COPY as C } from '../model/rating.copy.ts';
import { starsText } from '../model/ratingFormat.ts';
import type { RatingComment } from '../model/rating.types.ts';

interface RatingCommentsProps {
  readonly comments: readonly RatingComment[];
  readonly busy: boolean;
  readonly onReport: (ratingId: string) => void;
}

/** Danh sách lời bình ẩn danh gần đây; lời bình của người xem có nhãn "Của bạn" và không có nút báo cáo. */
export function RatingComments({ comments, busy, onReport }: RatingCommentsProps) {
  if (comments.length === 0) return null;
  return (
    <section className="rating-comments" aria-label={C.commentsTitle}>
      <h4>{C.commentsTitle}</h4>
      <ul>
        {comments.map((c) => (
          <li key={c.id}>
            <span className="rating-stars" role="img" aria-label={fill(C.starLabel, { n: c.stars })}>{starsText(c.stars)}</span>
            {c.mine ? <b className="rating-mine">{C.mine}</b> : null}
            <p>{c.comment}</p>
            {c.mine ? null : <Button kind="ghost" disabled={busy} onClick={() => onReport(c.id)}>{C.report}</Button>}
          </li>
        ))}
      </ul>
    </section>
  );
}
