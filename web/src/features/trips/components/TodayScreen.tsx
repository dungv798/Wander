import { lazy, Suspense } from 'react';
import { ScreenSkeleton } from '../../../shared/ui/Skeleton.tsx';

const Content = lazy(() => import('./TodayScreenContent.tsx').then(module => ({ default: module.TodayScreen })));

/** Loads the screen only when the route is opened; keeps the existing skeleton while waiting. */
export function TodayScreen({ tripId }: { readonly tripId: string | null }) {
  return <Suspense fallback={<ScreenSkeleton />}><Content tripId={tripId} /></Suspense>;
}
