import { useCallback } from 'react';
import { addDays } from '../../../shared/lib/dates.ts';
import type { DayPlan, PlaceRef } from '../model/tripState.ts';
import type { Trip } from '../model/trip.types.ts';
import { useTrips } from './TripsProvider.tsx';

/** Yêu cầu tạo chuyến từ một lịch mẫu: tên, điểm đến, ngày đi và các địa điểm của từng ngày (theo thứ tự đi). */
export interface TemplateTripSpec {
  readonly name: string;
  readonly destinationId: string;
  /** Ngày đi `yyyy-mm-dd`; ngày về = ngày đi + (số ngày − 1). */
  readonly startDate: string;
  readonly days: readonly (readonly PlaceRef[])[];
}

/** Tạo chuyến mới có sẵn các địa điểm xếp vào đúng ngày và thứ tự của lịch mẫu. Trả chuyến đã xếp. Gọi sau cổng danh tính. */
export function useCreateFromTemplate(): (spec: TemplateTripSpec) => Trip {
  const { actions } = useTrips();
  return useCallback(
    (spec) => {
      const endDate = addDays(spec.startDate, Math.max(spec.days.length, 1) - 1);
      const trip = actions.create({ name: spec.name, destinationId: spec.destinationId, startDate: spec.startDate, endDate }, spec.days.flat());
      const plan: Record<string, { day: string; position: number }> = {};
      spec.days.forEach((places, d) => {
        places.forEach((p, position) => {
          const item = trip.items.find((i) => i.placeId === p.id);
          if (item) plan[item.id] = { day: addDays(spec.startDate, d), position };
        });
      });
      actions.applyPlan(trip.id, plan as DayPlan);
      return actions.current(trip.id) ?? trip;
    },
    [actions],
  );
}
