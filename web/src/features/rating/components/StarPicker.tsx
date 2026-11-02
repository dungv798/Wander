import { fill } from '../../../shared/const/copy.vi.ts';
import { RATING } from '../model/rating.const.ts';
import { RATING_COPY as C } from '../model/rating.copy.ts';

interface StarPickerProps {
  readonly value: number;
  readonly onChange: (stars: number) => void;
  readonly disabled?: boolean;
}

/** Chọn 1–5 sao bằng nhóm nút bật/tắt (aria-pressed; Tab đi qua từng nút, Enter/Space chọn); mỗi nút ≥ 44 px bằng CSS `.star-btn`. */
export function StarPicker({ value, onChange, disabled }: StarPickerProps) {
  return (
    <div className="star-picker" role="group" aria-label={C.starsGroup}>
      {RATING.STAR_VALUES.map((n) => (
        <button key={n} type="button" aria-pressed={value === n} aria-label={fill(C.starLabel, { n })}
          className={`star-btn${n <= value ? ' on' : ''}`} disabled={disabled} onClick={() => onChange(n)}>
          {n <= value ? RATING.FILLED_STAR : RATING.EMPTY_STAR}
        </button>
      ))}
    </div>
  );
}
