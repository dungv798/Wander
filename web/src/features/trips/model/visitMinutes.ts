/** The number of minutes of a sightseeing 'day' when the catalog gives it per day (an ASSUMPTION of 8 hours, used only to arrange the suggested schedule). */
const DAY_MINUTES = 480;
const HALF_DAY_MINUTES = 240;
const HOUR_MINUTES = 60;
const MID = 2;

/** Reads a number (Vietnamese-style decimal comma); not a number gives null. */
function num(text: string): number | null {
  const value = Number(text.trim().replace(',', '.'));
  return Number.isFinite(value) ? value : null;
}

/**
 * Reads the sightseeing duration from the catalog label ('1-2 hours', '30-45 minutes', 'Half a day', '1-2 days') into a representative number of minutes (the midpoint).
 * An unknown or empty label returns null: the caller says plainly that there is no basis instead of assigning a duration itself.
 */
export function parseVisitMinutes(label: string | null | undefined): number | null {
  const text = (label ?? '').trim().toLowerCase().replace(/\s*\(tham khảo\)$/, '');
  if (!text) return null;
  if (text === 'cả ngày') return DAY_MINUTES;
  if (text === 'nửa ngày') return HALF_DAY_MINUTES;
  const m = /^(\d+(?:[.,]\d+)?)(?:\s*[–-]\s*(\d+(?:[.,]\d+)?))?\s*(giờ|phút|ngày)$/.exec(text);
  if (!m) return null;
  const low = num(m[1] as string);
  const high = m[2] ? num(m[2]) : low;
  if (low === null || high === null) return null;
  const unit = m[3] === 'ngày' ? DAY_MINUTES : m[3] === 'giờ' ? HOUR_MINUTES : 1;
  return Math.round(((low + high) / MID) * unit);
}
