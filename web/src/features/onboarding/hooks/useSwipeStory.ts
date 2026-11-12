import { useCallback, useEffect, useMemo, useState } from 'react';
import type { RefObject } from 'react';
import { useLatestRef } from '../../../shared/hooks/useLatestRef.ts';
import { useRunScope } from '../../../shared/hooks/useRunScope.ts';
import { SWIPE } from '../model/onboarding.const.ts';
import { ONBOARD_COPY as T } from '../model/onboarding.copy.ts';
import { playSwipeDemo } from '../model/swipeDemo.ts';
import type { Caption, DemoApi, LitButton, SwipeFocus, TouchMark } from '../model/swipeDemo.ts';
import type { SwipeKind } from '../model/swipeDeck.ts';

/** The phase of the scene: the demo is running, the demo has finished, or the viewer has swiped by themself. */
export type SwipePhase = 'playing' | 'ended' | 'user';

interface SwipeStoryDeps {
  readonly stage: RefObject<HTMLElement | null>;
  readonly cardEls: RefObject<(HTMLElement | null)[]>;
  /** The index of the current top card. */
  readonly cur: number;
  readonly commit: (kind: SwipeKind) => void;
  readonly setDragging: (index: number | null) => void;
  readonly resetAll: () => void;
  readonly auto: boolean;
  readonly onDone: () => void;
  readonly onInteract: () => void;
  readonly onCue: (ms: number) => void;
}

/** The UI state driven by the story and the viewer's actions on it. */
export interface SwipeStory {
  readonly caption: Caption | null;
  readonly lit: LitButton;
  readonly touch: TouchMark | null;
  readonly phase: SwipePhase;
  readonly focus: SwipeFocus;
  readonly hint: string;
  readonly setLit: (button: LitButton) => void;
  /** The viewer touches the deck: stops the demo at once, returns a half-done card to the middle, shows 'Watch again'. */
  readonly interrupt: () => void;
  /** Re-runs the demo from the start (the viewer did it on purpose so the scene does not advance by itself afterwards). */
  readonly replay: () => void;
}

/** Chooses the hint line under the buttons by phase. */
function hintFor(phase: SwipePhase): string {
  if (phase === 'user') return T.swipe.hintSelf;
  return phase === 'ended' ? T.swipe.hintTry : T.swipe.hint;
}

/** The swipe scene story: runs the demo by itself on entering the scene, stops as soon as the viewer touches, allows watching again. */
export function useSwipeStory(deps: SwipeStoryDeps): SwipeStory {
  const { stage, cardEls, cur, commit, setDragging, resetAll, auto, onDone, onInteract, onCue } = deps;
  const scope = useRunScope();
  const autoRef = useLatestRef(auto);
  const curRef = useLatestRef(cur);
  const commitRef = useLatestRef(commit);
  const [caption, setCaption] = useState<Caption | null>(null);
  const [lit, setLit] = useState<LitButton>(null);
  const [touch, setTouch] = useState<TouchMark | null>(null);
  const [phase, setPhase] = useState<SwipePhase>('playing');
  const [focus, setFocus] = useState<SwipeFocus>(null);
  const api = useMemo<DemoApi>(
    () => ({
      card: () => cardEls.current[curRef.current] ?? null,
      stage: () => stage.current?.getBoundingClientRect() ?? null,
      caption: setCaption,
      lit: setLit,
      touch: setTouch,
      drag: (on) => setDragging(on ? curRef.current : null),
      commit: (kind) => commitRef.current(kind),
      focus: setFocus,
    }),
    [cardEls, stage, curRef, commitRef, setDragging],
  );
  const play = useCallback(() => {
    void scope.start(async (run) => {
      await playSwipeDemo(run, api);
      setCaption(null);
      setPhase('ended');
      if (!autoRef.current) return;
      onCue(SWIPE.END_PAUSE_MS);
      await run.wait(SWIPE.END_PAUSE_MS);
      if (autoRef.current) onDone();
    });
  }, [scope, api, autoRef, onDone, onCue]);
  useEffect(() => {
    play();
  }, [play]);
  const interrupt = useCallback(() => {
    scope.cancel();
    onInteract();
    setCaption(null);
    setLit(null);
    setTouch(null);
    setFocus(null);
    setPhase('user');
    const el = cardEls.current[curRef.current];
    el?.style.removeProperty('--dx');
    el?.style.removeProperty('--dy');
    setDragging(null);
  }, [scope, onInteract, cardEls, curRef, setDragging]);
  const replay = useCallback(() => {
    onInteract();
    resetAll();
    setPhase('playing');
    play();
  }, [onInteract, resetAll, play]);
  return { caption, lit, touch, phase, focus, hint: hintFor(phase), setLit, interrupt, replay };
}
