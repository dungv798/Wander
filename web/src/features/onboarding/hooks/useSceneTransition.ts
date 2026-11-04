import { useEffect, useState } from 'react';
import { TRANSITION_MS } from '../model/onboarding.const.ts';

/** Trạng thái chuyển cảnh: cảnh cũ còn đang trượt ra (null = không chuyển) và hướng đi (1 = tiến, -1 = lùi). */
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
 * Giữ cảnh cũ trên màn hình thêm `TRANSITION_MS` khi đổi cảnh để nó trượt ra trong lúc cảnh mới trượt vào (cảnh không bị dựng lại nên giữ nguyên trạng thái).
 * Giảm chuyển động thì đổi ngay không giữ cảnh cũ.
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
