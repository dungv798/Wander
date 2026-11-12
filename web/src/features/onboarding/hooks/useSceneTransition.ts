import { useEffect, useState } from 'react';
import { TRANSITION_MS } from '../model/onboarding.const.ts';

/** The scene transition state: the old scene is still sliding out (null = no transition) and the direction (1 = forward, -1 = back). */
export interface SceneTransition {
  readonly prev: number | null;
  readonly dir: 1 | -1;
}

interface Tracked {
  readonly scene: number;
  readonly prev: number | null;
  readonly dir: 1 | -1;
}

/**
 * Keeps the old scene on the screen for `TRANSITION_MS` more on a scene change so it slides out while the new scene slides in (a scene is not rebuilt so it keeps its state).
 * Under reduced motion it changes at once without keeping the old scene.
 */
export function useSceneTransition(scene: number, reduced: boolean): SceneTransition {
  const [tracked, setTracked] = useState<Tracked>({ scene, prev: null, dir: 1 });
  if (tracked.scene !== scene) setTracked({ scene, prev: reduced ? null : tracked.scene, dir: scene > tracked.scene ? 1 : -1 });
  const { prev } = tracked;
  useEffect(() => {
    if (prev === null) return undefined;
    const timer = setTimeout(() => setTracked((t) => ({ ...t, prev: null })), TRANSITION_MS);
    return () => clearTimeout(timer);
  }, [prev, tracked.scene]);
  return { prev, dir: tracked.dir };
}
