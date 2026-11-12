import { useCallback, useMemo, useState } from 'react';
import { useLatestRef } from '../../../shared/hooks/useLatestRef.ts';
import { SCENES } from '../model/onboarding.const.ts';

/** The 'about to change scene' sign on the progress dot of scene `scene` (ms = the time left; 0 at the last scene = the story is finished). */
export interface OnboardCue {
  readonly scene: number;
  readonly ms: number;
}

/** Controls the four-scene flow: the current scene, whether it still advances by itself, and whether the viewer has acted yet (to move the focus to the new title). */
export interface OnboardFlow {
  readonly scene: number;
  readonly auto: boolean;
  readonly moved: boolean;
  /** The sign that the scene is about to change (only while it still runs by itself). */
  readonly cue: OnboardCue | null;
  /** Reports that the scene is about to change after `ms` milliseconds. */
  readonly announce: (ms: number) => void;
  /** The viewer chooses the scene (the Next/Back button/dots): stops the auto-advance. */
  readonly go: (to: number) => void;
  /** The scene has just finished and moves to the next by itself (only while still in auto mode). */
  readonly advance: () => void;
  /** The viewer touches the scene's content: from now on it does not advance by itself. */
  readonly takeControl: () => void;
}

/** Keeps the scene index in the valid range. */
function clampScene(n: number): number {
  return Math.max(0, Math.min(SCENES.length - 1, n));
}

/** The intro flow state: runs by itself scene by scene until the viewer takes control. */
export function useOnboardFlow(): OnboardFlow {
  const [scene, setScene] = useState(0);
  const [auto, setAuto] = useState(true);
  const [moved, setMoved] = useState(false);
  const [cue, setCue] = useState<OnboardCue | null>(null);
  const sceneRef = useLatestRef(scene);
  const announce = useCallback((ms: number) => setCue({ scene: sceneRef.current, ms }), [sceneRef]);
  const go = useCallback((to: number) => {
    setAuto(false);
    setCue(null);
    setMoved(true);
    setScene(clampScene(to));
  }, []);
  const advance = useCallback(() => {
    setCue(null);
    setMoved(true);
    setScene((s) => clampScene(s + 1));
  }, []);
  const takeControl = useCallback(() => {
    setAuto(false);
    setCue(null);
  }, []);
  const visible = auto && cue?.scene === scene ? cue : null;
  return useMemo(() => ({ scene, auto, moved, cue: visible, announce, go, advance, takeControl }), [scene, auto, moved, visible, announce, go, advance, takeControl]);
}
