import { useMemo, useRef } from 'react';
import { placeById } from '../../discover/index.ts';
import { useMapHealth } from '../hooks/useMapHealth.ts';
import { usePlanStory } from '../hooks/usePlanStory.ts';
import { ONBOARD_DESTINATION } from '../model/onboarding.const.ts';
import type { SceneProps } from '../model/onboarding.types.ts';
import { dayMarkers, dayRoute, fitIds, overviewMarkers, stopsRevealed } from '../model/planMap.ts';
import { buildTrip } from '../model/sampleTrip.ts';
import { DaySheet } from './DaySheet.tsx';
import { PlanMap } from './PlanMap.tsx';
import { ReplayButton } from './SwipeParts.tsx';

/** Cảnh 3: lịch hai ngày trên bản đồ. Tên chuyến → Ngày 1 (ghim 1→2→3→4, danh sách đồng bộ) → Ngày 2 → toàn chuyến; đường nối chỉ biểu diễn thứ tự ghé thăm. */
export function PlanScene({ dest, reduced, auto, onDone, onInteract, onCue }: SceneProps) {
  const days = useMemo(() => buildTrip((id) => placeById(dest, id)), [dest]);
  const host = useRef<HTMLDivElement | null>(null);
  const health = useMapHealth(host);
  const { view, phase, selectTab, replay } = usePlanStory({ days, settled: health.settled, reduced, auto, onDone, onInteract, onCue });
  const day = view.tab > 0 ? (days[view.tab - 1] ?? null) : null;
  const revealed = day ? stopsRevealed(day.items, view.rows) : 0;
  const markers = useMemo(() => (day ? dayMarkers(day, revealed) : overviewMarkers(days)), [day, days, revealed]);
  const route = useMemo(() => (day ? dayRoute(day, revealed) : null), [day, revealed]);
  const focus = useMemo(() => fitIds(day), [day]);
  return (
    <div className="ob-scene ob-plan">
      <PlanMap destId={ONBOARD_DESTINATION} markers={markers} route={route} focus={focus} hostRef={host} health={health} />
      <DaySheet days={days} tab={view.tab} rowsShown={view.rows} hot={view.hot} onTab={selectTab} />
      <ReplayButton story={{ phase }} onClick={replay} />
    </div>
  );
}
