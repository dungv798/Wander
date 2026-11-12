import type { KeyboardEvent } from 'react';
import { fill } from '../../../shared/const/copy.vi.ts';
import { dayLabel } from '../../../shared/lib/dates.ts';
import { TRIP_MODES, modeOfTab, tabOfMode } from '../model/tripTabs.ts';
import type { TripMode } from '../model/tripTabs.ts';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';

const MODE_ID = 'trip-mode';
const DAY_ID = 'trip-tab';
export const TRIP_PANEL_ID = 'trip-panel';

/** The label of each mode (the Not scheduled mode with the number of places with no date). */
function modeLabel(mode: TripMode, unassigned: number): string {
  if (mode === 'overview') return T.view.overview;
  if (mode === 'schedule') return T.view.modeSchedule;
  if (mode === 'cost') return T.view.modeCost;
  return unassigned ? `${T.view.modeUnassigned} · ${unassigned}` : T.view.modeUnassigned;
}

/** Left/right arrows, Home, End change the tab within ONE tab list (the WAI-ARIA pattern); returns the new key or null if the key is unrelated. */
function nextKey(event: KeyboardEvent, keys: readonly string[], current: string): string | null {
  const at = keys.indexOf(current);
  const next = event.key === 'ArrowRight' ? at + 1 : event.key === 'ArrowLeft' ? at - 1 : event.key === 'Home' ? 0 : event.key === 'End' ? keys.length - 1 : null;
  if (next === null) return null;
  event.preventDefault();
  return keys[(next + keys.length) % keys.length] ?? null;
}

interface TripNavProps {
  /** The current address suffix, already passed through `validTab`. */
  readonly tab: string;
  /** The days of the trip (yyyy-mm-dd). */
  readonly days: readonly string[];
  readonly unassigned: number;
  /** The day most recently viewed, so the Schedule mode goes back to exactly that day. */
  readonly lastDay: string;
  readonly onTab: (tab: string) => void;
}

/**
 * Two clearly separated control levels: the MODE bar (Overview / Schedule / Not scheduled / Cost) on top, and only in Schedule is there a lighter DAY-CHOOSING row.
 * Each level is its own tablist (only the selected tab is in the Tab order, the arrow keys change the tab); both control `trip-panel`.
 */
export function TripNav({ tab, days, unassigned, lastDay, onTab }: TripNavProps) {
  const mode = modeOfTab(tab);
  const modeKeys = TRIP_MODES.map(String);
  const dayKeys = days.map((_, k) => String(k + 1));
  return (
    <div className="trip-nav">
      {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus -- the tabs are child buttons; the arrow keys are handled here per the WAI-ARIA pattern */}
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
        // eslint-disable-next-line jsx-a11y/interactive-supports-focus -- the tabs are child buttons; the arrow keys are handled here per the WAI-ARIA pattern
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

/** The element id of the selected tab, so the `tabpanel` points `aria-labelledby` at the right level. */
export function activeTabId(tab: string): string {
  const mode = modeOfTab(tab);
  return mode === 'schedule' ? `${DAY_ID}-${tab}` : `${MODE_ID}-${mode}`;
}
