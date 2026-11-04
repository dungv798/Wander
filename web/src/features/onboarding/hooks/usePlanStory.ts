import { useCallback, useEffect, useState } from 'react';
import { useLatestRef } from '../../../shared/hooks/useLatestRef.ts';
import { useRunScope } from '../../../shared/hooks/useRunScope.ts';
import { PLAN_TIMING } from '../model/onboarding.const.ts';
import type { TripDay } from '../model/onboarding.types.ts';
import { fullView, playPlan } from '../model/planStory.ts';
import type { PlanView } from '../model/planStory.ts';
import type { SwipePhase } from './useSwipeStory.ts';

interface PlanStoryDeps {
  readonly days: readonly TripDay[];
  readonly settled: Promise<void>;
  readonly reduced: boolean;
  readonly auto: boolean;
  readonly onDone: () => void;
  readonly onInteract: () => void;
  readonly onCue: (ms: number) => void;
}

/** Trạng thái câu chuyện của cảnh bản đồ và thao tác của người xem. */
export interface PlanStory {
  readonly view: PlanView;
  readonly phase: SwipePhase;
  /** Người xem chọn tab: dừng phần tự chạy và hiện đủ ngày đó. */
  readonly selectTab: (tab: number) => void;
  readonly replay: () => void;
}

/** Câu chuyện cảnh bản đồ: tự chạy khi vào cảnh (chờ bản đồ sẵn sàng), dừng khi người xem chạm tab, cho xem lại. Giảm chuyển động: hiện thẳng Ngày 1 đầy đủ. */
export function usePlanStory({ days, settled, reduced, auto, onDone, onInteract, onCue }: PlanStoryDeps): PlanStory {
  const scope = useRunScope();
  const autoRef = useLatestRef(auto);
  const [view, setView] = useState<PlanView>(() => (reduced ? fullView(1) : { tab: 0, rows: 0, hot: -1 }));
  const [phase, setPhase] = useState<SwipePhase>(reduced ? 'user' : 'playing');
  const play = useCallback(() => {
    void scope.start(async (run) => {
      await playPlan(run, days, settled, setView);
      setPhase('ended');
      if (!autoRef.current) return;
      onCue(PLAN_TIMING.FINALE_MS);
      await run.wait(PLAN_TIMING.FINALE_MS);
      if (autoRef.current) onDone();
    });
  }, [scope, days, settled, autoRef, onDone, onCue]);
  useEffect(() => {
    if (!reduced) play();
  }, [play, reduced]);
  const selectTab = useCallback(
    /** Dừng kịch bản và hiện đủ tab đã chọn. */
    (tab: number) => {
      scope.cancel();
      onInteract();
      setPhase('user');
      setView(fullView(tab));
    },
    [scope, onInteract],
  );
  const replay = useCallback(() => {
    onInteract();
    setPhase('playing');
    play();
  }, [onInteract, play]);
  return { view, phase, selectTab, replay };
}
