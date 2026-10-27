import { MAX_TRIP_STYLES, TRIP_PACES, TRIP_STYLES } from './api';
import type { Trip } from './api';

/** Giá trị biểu mẫu của tùy chọn chuyến đi (Q11): ngân sách là chuỗi để giữ nguyên cách người dùng gõ (D17). */
export interface TripOptionsValue {
  budget: string;
  styles: string[];
  pace: string;
}

export const optionsFromTrip = (t?: Trip): TripOptionsValue => ({
  budget: t?.budgetK?.toString() ?? '',
  styles: t?.styles.map((s) => s.code) ?? [],
  pace: t?.pace?.code ?? '',
});

/** Phần gửi lên API: ngân sách trống = chưa đặt; nhịp rỗng = chưa đặt. */
export const optionsPayload = (v: TripOptionsValue) => ({ budget: v.budget, styles: v.styles, pace: v.pace });

export function TripOptionsFields({ value, onChange }: { value: TripOptionsValue; onChange: (v: TripOptionsValue) => void }) {
  const toggleStyle = (code: string) => {
    const has = value.styles.includes(code);
    if (!has && value.styles.length >= MAX_TRIP_STYLES) return;
    onChange({ ...value, styles: has ? value.styles.filter((s) => s !== code) : [...value.styles, code] });
  };
  return (
    <div className="stack">
      <label>
        Ngân sách dự kiến (nghìn đồng, tùy chọn)
        <input
          inputMode="numeric"
          value={value.budget}
          onChange={(e) => onChange({ ...value, budget: e.target.value })}
          placeholder="Ví dụ 5000 = 5.000.000 ₫"
        />
      </label>
      <div>
        <div id="trip-styles-label">Kiểu chuyến (tối đa {MAX_TRIP_STYLES}, tùy chọn)</div>
        <div className="chips" role="group" aria-labelledby="trip-styles-label">
          {TRIP_STYLES.map((s) => (
            <button
              key={s.code}
              type="button"
              role="checkbox"
              aria-checked={value.styles.includes(s.code)}
              disabled={!value.styles.includes(s.code) && value.styles.length >= MAX_TRIP_STYLES}
              className={value.styles.includes(s.code) ? 'chip on' : 'chip'}
              onClick={() => toggleStyle(s.code)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div id="trip-pace-label">Nhịp chuyến (tùy chọn)</div>
        <div className="chips" role="radiogroup" aria-labelledby="trip-pace-label">
          {TRIP_PACES.map((p) => (
            <button
              key={p.code}
              type="button"
              role="radio"
              aria-checked={value.pace === p.code}
              className={value.pace === p.code ? 'chip on' : 'chip'}
              onClick={() => onChange({ ...value, pace: value.pace === p.code ? '' : p.code })}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
