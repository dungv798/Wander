import { lazy, Suspense } from 'react';
import { ScreenSkeleton } from '../../../shared/ui/Skeleton.tsx';

const Content = lazy(() => import('./SecurityScreenContent.tsx').then(module => ({ default: module.SecurityScreen })));

/** Loads the screen only when the route is opened and keeps a skeleton while waiting. */
export function SecurityScreen() {
  return <Suspense fallback={<ScreenSkeleton />}><Content /></Suspense>;
}

const Retry = lazy(() => import('./SecurityScreenContent.tsx').then(module => ({ default: module.RetryState })));

/** Keeps the shared retry state inside the lazy-loading boundary. */
export function RetryState() {
  return <Suspense fallback={<ScreenSkeleton />}><Retry /></Suspense>;
}
