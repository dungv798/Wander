import { useState } from 'react';
import { fill } from '../../../shared/const/copy.vi.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { Field } from '../../../shared/ui/Field.tsx';
import { RATING } from '../model/rating.const.ts';
import { RATING_COPY as C } from '../model/rating.copy.ts';
import type { MyRating } from '../model/rating.types.ts';
import { StarPicker } from './StarPicker.tsx';

interface RatingFormProps {
  readonly mine: MyRating | null;
  readonly busy: boolean;
  readonly onSave: (stars: number, comment: string) => void;
  readonly onRemove: () => void;
}

/** Biểu mẫu "Bạn chấm": chọn sao, lời bình tùy chọn, gửi/cập nhật và xóa. Dùng với `key` đổi theo bản đã lưu để nạp lại giá trị ban đầu. */
export function RatingForm({ mine, busy, onSave, onRemove }: RatingFormProps) {
  const [stars, setStars] = useState(mine?.stars ?? 0);
  const [comment, setComment] = useState(mine?.comment ?? '');
  return (
    <div className="rating-mine-box">
      <b>{C.yourRating}</b>
      <StarPicker value={stars} onChange={setStars} disabled={busy} />
      <Field as="textarea" label={C.commentLabel} value={comment} onChange={setComment} rows={RATING.COMMENT_ROWS}
        maxLength={RATING.COMMENT_MAX_LENGTH} hint={fill(C.commentHint, { max: RATING.COMMENT_MAX_LENGTH })} />
      <div className="rating-actions">
        <Button disabled={busy || stars === 0} onClick={() => onSave(stars, comment)}>{mine ? C.update : C.save}</Button>
        {mine ? <Button kind="ghost" disabled={busy} onClick={onRemove}>{C.remove}</Button> : null}
      </div>
    </div>
  );
}
