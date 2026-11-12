import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import type { Dispatch, RefObject } from 'react';
import { useLatestRef } from '../../../shared/hooks/useLatestRef.ts';
import { useRunScope } from '../../../shared/hooks/useRunScope.ts';
import type { RunScope } from '../../../shared/lib/RunScope.ts';
import type { PlaceView } from '../../discover/index.ts';
import { MEMBERS, SHARE_TIMING } from '../model/onboarding.const.ts';
import { ONBOARD_COPY as T } from '../model/onboarding.copy.ts';
import type { TripDay } from '../model/onboarding.types.ts';
import { initialShare, shareReducer } from '../model/shareState.ts';
import type { ShareAction, ShareState } from '../model/shareState.ts';
import { acceptedText, centerIn, joinFriends, playShare } from '../model/shareStory.ts';
import type { ShareApi, ShareTarget } from '../model/shareStory.ts';
import type { TouchMark } from '../model/swipeDemo.ts';
import { useToast } from './useToast.ts';
import type { SwipePhase } from './useSwipeStory.ts';

interface ShareStoryDeps {
  readonly baseDays: readonly TripDay[];
  /** The suggested place (null if the catalog lacks it: the scene is still built but the suggestion part is dropped). */
  readonly proposal: PlaceView | null;
  readonly settled: Promise<void>;
  readonly reduced: boolean;
  /** Whether it still runs by itself: only while it still runs by itself does it hint at the start button when the story is told. */
  readonly auto: boolean;
  readonly onInteract: () => void;
  readonly onCue: (ms: number) => void;
  readonly stage: RefObject<HTMLElement | null>;
  readonly buttons: Readonly<Record<ShareTarget, RefObject<HTMLElement | null>>>;
}

/** The viewer's real actions on the share scene. */
export interface ShareActions {
  /** The viewer touches the scene (for example changes a tab): stops the self-running part. */
  readonly interrupt: () => void;
  readonly share: () => void;
  readonly copy: () => void;
  readonly accept: () => void;
  readonly reject: () => void;
}

/** The result of the share story: the state, the touch dot, the notice, the stage, the actions and 'Watch again'. */
export interface ShareStory extends ShareActions {
  readonly state: ShareState;
  readonly touch: TouchMark | null;
  readonly toast: string | null;
  readonly phase: SwipePhase;
  readonly replay: () => void;
}

/** The full state for the static version: the suggestion accepted, all three members. */
function finalState(base: ShareState, place: PlaceView | null): ShareState {
  const joined = MEMBERS.filter((m) => m.id !== 'me').reduce((s, m) => shareReducer(s, { type: 'join', member: m.id }), base);
  if (!place) return joined;
  const steps: ShareAction[] = [{ type: 'share' }, { type: 'propose' }, { type: 'accept', place }];
  return steps.reduce(shareReducer, joined);
}

interface ActionDeps {
  readonly scope: RunScope;
  readonly api: ShareApi;
  readonly dispatch: Dispatch<ShareAction>;
  readonly proposal: PlaceView | null;
  readonly onInteract: () => void;
  readonly setTouch: (mark: TouchMark | null) => void;
  readonly setPhase: (phase: SwipePhase) => void;
}

/** The viewer's actions: each action stops the self-running part; copying brings the friends in and then shows the suggestion (a manual chain). */
function useShareActions({ scope, api, dispatch, proposal, onInteract, setTouch, setPhase }: ActionDeps): ShareActions {
  const interrupt = useCallback(() => {
    scope.cancel();
    onInteract();
    setTouch(null);
    setPhase('user');
  }, [scope, onInteract, setTouch, setPhase]);
  const share = useCallback(() => {
    interrupt();
    dispatch({ type: 'share' });
  }, [interrupt, dispatch]);
  const copy = useCallback(() => {
    interrupt();
    dispatch({ type: 'copy' });
    api.toast(T.share.toastCopied);
    if (!proposal) return;
    void scope.start(async (run) => {
      await joinFriends(run, api);
      await run.wait(SHARE_TIMING.MANUAL_PROPOSAL_MS);
      dispatch({ type: 'propose' });
    });
  }, [interrupt, dispatch, scope, api, proposal]);
  const accept = useCallback(() => {
    interrupt();
    if (!proposal) return;
    dispatch({ type: 'accept', place: proposal });
    api.toast(acceptedText(proposal));
  }, [interrupt, dispatch, api, proposal]);
  const reject = useCallback(() => {
    interrupt();
    dispatch({ type: 'reject' });
    api.toast(T.share.rejected);
  }, [interrupt, dispatch, api]);
  return { interrupt, share, copy, accept, reject };
}

/** The share scene story (illustrative): runs the whole chain by itself, or the viewer presses each button themself (the self-running part stops as soon as they touch). It creates no real link and sends no data. */
export function useShareStory(deps: ShareStoryDeps): ShareStory {
  const { baseDays, proposal, settled, reduced, auto, onInteract, onCue, stage, buttons } = deps;
  const scope = useRunScope();
  const autoRef = useLatestRef(auto);
  const base = useMemo(() => initialShare(baseDays, MEMBERS[0].id), [baseDays]);
  const [state, dispatch] = useReducer(shareReducer, undefined, () => (reduced ? finalState(base, proposal) : base));
  const { toast, show } = useToast();
  const [touch, setTouch] = useState<TouchMark | null>(null);
  const [phase, setPhase] = useState<SwipePhase>(reduced ? 'user' : 'playing');
  const api = useMemo<ShareApi>(
    () => ({
      dispatch,
      toast: show,
      touch: setTouch,
      center: (target) => {
        const el = buttons[target].current;
        const box = stage.current?.getBoundingClientRect();
        return el && box ? centerIn(el.getBoundingClientRect(), box) : null;
      },
    }),
    [show, buttons, stage],
  );
  const play = useCallback(() => {
    if (!proposal) return;
    void scope.start(async (run) => {
      await playShare(run, api, settled, proposal);
      setPhase('ended');
      if (autoRef.current) onCue(0);
    });
  }, [scope, api, settled, proposal, onCue, autoRef]);
  useEffect(() => {
    if (!reduced) play();
  }, [play, reduced]);
  const actions = useShareActions({ scope, api, dispatch, proposal, onInteract, setTouch, setPhase });
  const replay = useCallback(() => {
    onInteract();
    dispatch({ type: 'reset', state: base });
    setPhase('playing');
    play();
  }, [onInteract, base, play]);
  return { state, touch, toast, phase, replay, ...actions };
}
