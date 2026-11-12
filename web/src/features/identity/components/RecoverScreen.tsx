import { lazy, Suspense } from 'react';
import { ScreenSkeleton } from '../../../shared/ui/Skeleton.tsx';

const Content = lazy(() => import('./RecoverScreenContent.tsx').then(module => ({ default: module.RecoverScreen })));

/** Loads the screen only when the route is opened and keeps a skeleton while waiting. */
export function RecoverScreen() {
  return <Suspense fallback={<ScreenSkeleton />}><Content /></Suspense>;
}
