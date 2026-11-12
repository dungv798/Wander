import { useMemo, useState } from 'react';
import { collabGateway, useLoaded } from '../../collab/index.ts';
import { useReportError } from '../../identity/index.ts';
import { useToast } from '../../../shared/ui/Toast.tsx';
import { fill } from '../../../shared/const/copy.vi.ts';
import { useTripView } from './TripViewContext.tsx';
import { useTrips } from './TripsProvider.tsx';
import { useUndoable } from './useUndoable.ts';
import { planPreview, summarizePlan, withDayOverrides } from '../model/planDays.ts';
import { PLAN_DAYS } from '../model/planDays.const.ts';
import { planDraftKey } from '../model/planDraft.ts';
import { parseVisitMinutes } from '../model/visitMinutes.ts';
import { unassignedItems } from '../model/tripMath.ts';
import { coordOf, hubPoint } from '../model/tripView.ts';
import { permissionsOf } from '../model/tripPermissions.ts';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';
import type { DeferredPlanItem } from '../model/planDays.ts';

/** Recomputes the base plan only when the schedule/catalog/requests change, not re-running nearest-neighbour on every select change. */
function usePlanData() {
  const { trip, cat, days } = useTripView();
  const requests = useLoaded(() => collabGateway.requests(trip.id), [trip.id]);
  const inputKey = planDraftKey(trip);
  const [choices, setChoices] = useState({ inputKey, values: {} as Readonly<Record<string, string>> });
  const base = useMemo(() => {
    const durationOf = (id: string): number | null => parseVisitMinutes(cat.place(id)?.duration);
    const manual = new Set(unassignedItems(trip).filter(item => item.placeId && cat.place(item.placeId)?.category === 'leo' && (item.durationMin ?? durationOf(item.placeId) ?? Number.POSITIVE_INFINITY) > PLAN_DAYS.fullDayMin).map(item => item.id));
    const protectedIds = new Set((requests.data ?? []).filter(request => request.status === 'pending').map(request => request.itemId));
    return { ...planPreview(trip, coordOf(cat), hubPoint(cat.dest), durationOf, manual, protectedIds), durationOf, protectedIds };
  }, [trip, cat, requests.data]);
  const overrides = choices.inputKey === inputKey ? choices.values : {};
  const allowed = Object.fromEntries(Object.entries(overrides).filter(([id]) => !base.protectedIds.has(id)));
  const plan = withDayOverrides(trip, base.plan, allowed);
  const summaries = summarizePlan(trip, plan, base.durationOf, coordOf(cat), hubPoint(cat.dest));
  /** Changing a day is an explicit choice, not written to the server; changing the schedule in another tab drops the old draft. */
  const chooseDay = (id: string, day: string): void => setChoices({ inputKey, values: { ...overrides, [id]: day } });
  const reasons = new Map(base.deferred.map(item => [item.itemId, item.reason]));
  const deferred: DeferredPlanItem[] = unassignedItems(trip).filter(item => !plan[item.id]).map(item => ({ itemId: item.id, reason: reasons.get(item.id) ?? 'choice' }));
  return { trip, cat, days, requests, base, plan, summaries, chooseDay, deferred, plannedCount: Object.keys(plan).length };
}

/** Re-checks the schedule/requests before one atomic schedule; an error keeps the preview, only success closes it and has Undo. */
function usePlanApply(model: ReturnType<typeof usePlanData>, onClose: () => void) {
  const { actions } = useTrips();
  const undoable = useUndoable();
  const toast = useToast();
  const report = useReportError();
  const [busy, setBusy] = useState(false);
  const apply = async (): Promise<void> => {
    if (busy || !model.plannedCount || !model.requests.data || model.requests.error || !permissionsOf(model.trip).schedule) return;
    setBusy(true);
    try {
      await actions.idle(model.trip.id);
      if (actions.current(model.trip.id) !== model.trip) { toast.show(T.plan.changed); return; }
      const requests = await collabGateway.requests(model.trip.id);
      if (requests.some(request => request.status === 'pending' && model.plan[request.itemId])) {
        model.requests.reload();
        toast.show(T.plan.changed);
        return;
      }
      const saved = await undoable(model.trip.id, () => actions.applyPlan(model.trip.id, model.plan), fill(T.plan.done, { n: model.plannedCount }));
      if (saved) onClose();
    } catch (error) { report(error); }
    finally { setBusy(false); }
  };
  return { busy, apply };
}

/** Joins the pure preview with permissions, the request lifecycle and the save action; the component only handles presentation. */
export function useAutoPlan(onClose: () => void) {
  const model = usePlanData();
  return { ...model, ...usePlanApply(model, onClose) };
}
