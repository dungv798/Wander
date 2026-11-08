import type { KeyboardEvent } from 'react';
import { fill } from '../../../shared/const/copy.vi.ts';
import { dayLabel } from '../../../shared/lib/dates.ts';
import { TRIP_MODES, modeOfTab, tabOfMode } from '../model/tripTabs.ts';
import type { TripMode } from '../model/tripTabs.ts';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';

const MODE_ID = 'trip-mode';
const DAY_ID = 'trip-tab';
export const TRIP_PANEL_ID = 'trip-panel';

/** Nhãn của từng chế độ (chế độ Chưa xếp kèm số nơi chưa có ngày). */
function modeLabel(mode: TripMode, unassigned: number): string {
  if (mode === 'overview') return T.view.overview;
  if (mode === 'schedule') return T.view.modeSchedule;
  if (mode === 'cost') return T.view.modeCost;
  return unassigned ? `${T.view.modeUnassigned} · ${unassigned}` : T.view.modeUnassigned;
}

/** Mũi tên trái/phải, Home, End đổi tab trong MỘT danh sách tab (mẫu WAI-ARIA); trả khóa mới hoặc null nếu phím không liên quan. */
function nextKey(event: KeyboardEvent, keys: readonly string[], current: string): string | null {
  const at = keys.indexOf(current);
  const next = event.key === 'ArrowRight' ? at + 1 : event.key === 'ArrowLeft' ? at - 1 : event.key === 'Home' ? 0 : event.key === 'End' ? keys.length - 1 : null;
  if (next === null) return null;
  event.preventDefault();
  return keys[(next + keys.length) % keys.length] ?? null;
}

interface TripNavProps {
  /** Phần phụ địa chỉ hiện tại, đã qua `validTab`. */
  readonly tab: string;
  /** Các ngày của chuyến (yyyy-mm-dd). */
  readonly days: readonly string[];
  readonly unassigned: number;
  /** Ngày đang xem gần nhất, để chế độ Lịch quay lại đúng ngày đó. */
  readonly lastDay: string;
  readonly onTab: (tab: string) => void;
}

/**
 * Hai tầng điều khiển tách bạch: thanh CHẾ ĐỘ (Tổng quan / Lịch / Chưa xếp / Chi phí) ở trên, và chỉ khi ở Lịch mới có hàng CHỌN NGÀY nhẹ hơn.
 * Mỗi tầng là một tablist riêng (chỉ tab đang chọn nằm trong thứ tự Tab, phím mũi tên đổi tab); cả hai cùng điều khiển `trip-panel`.
 */
export function TripNav({ tab, days, unassigned, lastDay, onTab }: TripNavProps) {
  const mode = modeOfTab(tab);
  const modeKeys = TRIP_MODES.map(String);
  const dayKeys = days.map((_, k) => String(k + 1));
  return (
    <div className="trip-nav">
      {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus -- các tab là nút con; phím mũi tên xử lý ở đây theo mẫu WAI-ARIA */}
      <div className="tmodes" role="tablist" aria-label={T.view.modesLabel} onKeyDown={(e) => {
        const key = nextKey(e, modeKeys, mode);
        if (!key) return;
        onTab(tabOfMode(key as TripMode, lastDay));
        document.getElementById(`${MODE_ID}-${key}`)?.focus();
      }}>
        {TRIP_MODES.map((m) => (
          <button key={m} id={`${MODE_ID}-${m}`} className="tmode" role="tab" type="button" aria-selected={mode === m} aria-controls={TRIP_PANEL_ID} tabIndex={mode === m ? 0 : -1} onClick={() => onTab(tabOfMode(m, lastDay))}>
            {modeLabel(m, unassigned)}
          </button>
        ))}
      </div>
      {mode === 'schedule' ? (
        // eslint-disable-next-line jsx-a11y/interactive-supports-focus -- các tab là nút con; phím mũi tên xử lý ở đây theo mẫu WAI-ARIA
        <div className="tdays" role="tablist" aria-label={T.view.daysTabs} onKeyDown={(e) => {
          const key = nextKey(e, dayKeys, tab);
          if (!key) return;
          onTab(key);
          document.getElementById(`${DAY_ID}-${key}`)?.focus();
        }}>
          {days.map((d, k) => {
            const key = String(k + 1);
            return (
              <button key={d} id={`${DAY_ID}-${key}`} className="dtab" role="tab" type="button" aria-selected={tab === key} aria-controls={TRIP_PANEL_ID} tabIndex={tab === key ? 0 : -1} onClick={() => onTab(key)}>
                {fill(T.view.day, { n: k + 1 })}
                <small aria-hidden="true">{dayLabel(d)}</small>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

/** Mã phần tử của tab đang chọn, để `tabpanel` trỏ `aria-labelledby` đúng tầng. */
export function activeTabId(tab: string): string {
  const mode = modeOfTab(tab);
  return mode === 'schedule' ? `${DAY_ID}-${tab}` : `${MODE_ID}-${mode}`;
}
