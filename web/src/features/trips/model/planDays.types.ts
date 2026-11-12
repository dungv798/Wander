import type { GeoPoint } from '../../../shared/lib/geo.ts';
import type { DayPlan } from './tripState.ts';

export type DurationOf = (placeId: string) => number | null;
export type CoordinateOf = (placeId: string) => GeoPoint | null;
export type DeferredReason = 'capacity' | 'location' | 'booking' | 'time' | 'pending' | 'manual' | 'choice' | 'stay';
export interface DeferredPlanItem { readonly itemId: string; readonly reason: DeferredReason }

/** The minutes are estimates; a missing real duration is kept separately, an internal weight is not turned into a fact. */
export interface PlanDayPreview {
  readonly day: string;
  readonly itemIds: readonly string[];
  readonly existingIds: readonly string[];
  readonly knownMinutes: number;
  readonly totalKnownMinutes: number;
  readonly unknownCount: number;
  readonly totalUnknownCount: number;
  readonly travelMinutes: number;
  readonly unknownTravelCount: number;
  readonly loadMinutes: number;
  readonly capacityMinutes: number;
  readonly timedCount: number;
  readonly overloaded: boolean;
  readonly empty: boolean;
}

/** The plan contains only the suggested items with no day; deferred stays in the trip as is to be chosen by hand. */
export interface PlanPreview {
  readonly plan: DayPlan;
  readonly days: readonly PlanDayPreview[];
  readonly emptyDays: readonly string[];
  readonly unknownDuration: number;
  readonly manualItemIds: readonly string[];
  readonly deferred: readonly DeferredPlanItem[];
}
