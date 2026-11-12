import { dayLabel } from '../../../shared/lib/dates.ts';
import type { Trip, TripItem } from './trip.types.ts';
import { isPlain, summarizeCosts, tripDays, dayItems } from './tripMath.ts';
import { itemsByTime } from './todayView.ts';

/** Three ways to save/send the itinerary (S18). This version is a PREVIEW only; no file is created yet. */
export type ExportKind = 'image' | 'pdf' | 'calendar';

/** The display name of an item (a place takes its name from the catalog). */
export type NameOf = (item: TripItem) => string;

/** The card by day of the Image kind. */
export interface ImageCard {
  readonly dayNumber: number;
  readonly label: string;
  readonly names: readonly string[];
}

/** The cost cell in the PDF table per D17/D18: price known - included (not added) - price unknown - no price (Rest/To-do). */
export type CostCell = { readonly kind: 'known'; readonly k: number } | { readonly kind: 'included' } | { readonly kind: 'unknown' } | { readonly kind: 'none' };

/** One row of the PDF table. */
export interface PdfRow {
  readonly dayNumber: number;
  readonly dayLabel: string;
  readonly time: string | null;
  readonly name: string;
  readonly cost: CostCell;
}

/** The PDF table: the rows, the total only adds items with a known price and the number of items with an unknown price. */
export interface PdfTable {
  readonly rows: readonly PdfRow[];
  readonly totalK: number;
  readonly unknownCount: number;
}

/** One event of the Calendar kind: an item with no time is an all-day event (the time zone is decided by the device). */
export interface CalendarEvent {
  readonly date: string;
  readonly time: string | null;
  readonly durationMin: number | null;
  readonly title: string;
}

/** Every item that has a day, by day and time (an item with 'No date yet' is not exported: it is not known where to put it). */
function datedByDay(trip: Trip): readonly { readonly day: string; readonly dayNumber: number; readonly items: readonly TripItem[] }[] {
  return tripDays(trip).map((day, i) => ({ day, dayNumber: i + 1, items: itemsByTime(dayItems(trip, day)) }));
}

/** The real day label of a day; a trip with 'tentative dates' has fake dates (start date + number of days) so it does NOT show a date (returns an empty string). */
function realDate(trip: Pick<Trip, 'datesTentative'>, day: string): string {
  return trip.datesTentative ? '' : dayLabel(day);
}

/** The number of 'No date yet' items (not in the export; the preview must say so clearly). */
export function undatedCount(trip: Pick<Trip, 'items'>): number {
  return trip.items.filter((i) => i.day === null).length;
}

/** The card by day (Image kind). A day with no item still has a card (an empty list). */
export function imageCards(trip: Trip, nameOf: NameOf): ImageCard[] {
  return datedByDay(trip).map((d) => ({ dayNumber: d.dayNumber, label: realDate(trip, d.day), names: d.items.map(nameOf) }));
}

/** The cost cell of an item per D17/D18. */
export function costCell(item: TripItem): CostCell {
  if (isPlain(item.type)) return { kind: 'none' };
  if (item.included) return { kind: 'included' };
  return item.costK === null ? { kind: 'unknown' } : { kind: 'known', k: item.costK };
}

/** The PDF table: day/time/item/cost; the total only adds items with a known price (the same rule as the Cost box). */
export function pdfTable(trip: Trip, nameOf: NameOf): PdfTable {
  const rows = datedByDay(trip).flatMap((d) => d.items.map((i) => ({ dayNumber: d.dayNumber, dayLabel: realDate(trip, d.day), time: i.timeOfDay, name: nameOf(i), cost: costCell(i) })));
  const dated = trip.items.filter((i) => i.day !== null);
  const sum = summarizeCosts({ items: dated });
  return { rows, totalK: sum.totalK, unknownCount: sum.unknownCount };
}

/** The events for the Calendar kind: one event per item that has a day; no time = all day. */
export function calendarEvents(trip: Trip, nameOf: NameOf): CalendarEvent[] {
  if (trip.datesTentative) return [];
  return datedByDay(trip).flatMap((d) => d.items.map((i) => ({ date: d.day, time: i.timeOfDay, durationMin: i.durationMin, title: nameOf(i) })));
}
