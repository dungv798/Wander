import { useCallback } from 'react';
import { addDays } from '../../../shared/lib/dates.ts';
import type { DayPlan, PlaceRef } from '../model/tripState.ts';
import type { Trip } from '../model/trip.types.ts';
import { useTrips } from './TripsProvider.tsx';

/** The request to create a trip from a sample itinerary: the name, the destination, the start date and the places of each day (in visiting order). */
export interface TemplateTripSpec {
  readonly name: string;
  readonly destinationId: string;
  /** The start date `yyyy-mm-dd`; the end date = the start date + (number of days - 1). */
  readonly startDate: string;
  readonly days: readonly (readonly PlaceRef[])[];
}

/** Creates a new trip that already has the places arranged into the exact days and order of the sample itinerary. Returns the arranged trip (the id issued by the server). Called after the identity gate; a failure throws `ApiError`. */
export function useCreateFromTemplate(): (spec: TemplateTripSpec) => Promise<Trip> {
  const { actions } = useTrips();
  return useCallback(
    async (spec) => {
      const endDate = addDays(spec.startDate, Math.max(spec.days.length, 1) - 1);
      const trip = await actions.create({ name: spec.name, destinationId: spec.destinationId, startDate: spec.startDate, endDate }, spec.days.flat());
      const plan: Record<string, { day: string; position: number }> = {};
      spec.days.forEach((places, d) => {
        places.forEach((p, position) => {
          const item = trip.items.find((i) => i.placeId === p.id);
          if (item) plan[item.id] = { day: addDays(spec.startDate, d), position };
        });
      });
      await actions.applyPlan(trip.id, plan as DayPlan);
      return actions.current(trip.id) ?? trip;
    },
    [actions],
  );
}
