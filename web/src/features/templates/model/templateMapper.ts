import type { DestinationDetail, PlaceView } from '../../discover/index.ts';
import { MAX_TEMPLATE_DAYS, MAX_TEXT, MAX_TITLE } from './templates.const.ts';
import type { TemplateDay, TemplateStatus, TemplateView } from './template.types.ts';

type Rec = Record<string, unknown>;

/** Whether it is a plain object. */
function isRec(v: unknown): v is Rec {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** A non-empty string with its length cut, or null. */
function text(v: unknown, max: number): string | null {
  return typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null;
}

/** Joins a day with the catalog: a place not in the catalog or already seen in an earlier day is dropped (each place only once in a trip). */
function toDay(raw: unknown, byId: ReadonlyMap<string, PlaceView>, used: Set<string>): TemplateDay {
  const rec = isRec(raw) ? raw : {};
  const ids = Array.isArray(rec['places']) ? rec['places'].filter((x): x is string => typeof x === 'string') : [];
  const places = ids.flatMap((id) => {
    const p = byId.get(id);
    if (!p || used.has(id)) return [];
    used.add(id);
    return [p];
  });
  return { places, note: text(rec['note'], MAX_TEXT) };
}

/** Joins a raw sample itinerary with the catalog; returns null if the id/name is missing or no valid place is left. */
function toTemplate(raw: unknown, byId: ReadonlyMap<string, PlaceView>): TemplateView | null {
  if (!isRec(raw)) return null;
  const id = text(raw['id'], MAX_TITLE);
  const title = text(raw['title'], MAX_TITLE);
  if (!id || !title || !Array.isArray(raw['days'])) return null;
  const used = new Set<string>();
  const days = raw['days'].slice(0, MAX_TEMPLATE_DAYS).map((d) => toDay(d, byId, used));
  if (!used.size) return null;
  const status: TemplateStatus = raw['status'] === 'approved' || raw['status'] === 'reference' ? raw['status'] : 'draft';
  return { id, title, summary: text(raw['summary'], MAX_TEXT) ?? '', status, days, placeCount: used.size };
}

/**
 * Turns raw sample-itinerary JSON (untrusted) into a view tied to the destination. A sample itinerary that is invalid or points to a removed place is dropped;
 * an unknown status counts as a draft (safe: while not approved it always has the label).
 */
export function toTemplateViews(raw: unknown, dest: DestinationDetail): TemplateView[] {
  if (!isRec(raw) || !Array.isArray(raw['templates'])) return [];
  const byId = new Map(dest.places.map((p) => [p.id, p]));
  const seen = new Set<string>();
  return raw['templates'].flatMap((t) => {
    const view = toTemplate(t, byId);
    if (!view || seen.has(view.id)) return [];
    seen.add(view.id);
    return [view];
  });
}
