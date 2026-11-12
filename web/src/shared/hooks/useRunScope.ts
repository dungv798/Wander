import { useEffect, useState } from 'react';
import { RunScope } from '../lib/RunScope.ts';

/** A run manager tied to the component lifecycle: leaving the screen cleanly cancels every pending storytelling animation. */
export function useRunScope(): RunScope {
  const [scope] = useState(() => new RunScope());
  useEffect(() => () => scope.cancel(), [scope]);
  return scope;
}
