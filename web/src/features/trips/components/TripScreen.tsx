import { lazy, Suspense } from 'react';
import { ScreenSkeleton } from '../../../shared/ui/Skeleton.tsx';

const Content = lazy(() => import('./TripScreenContent.tsx').then(module => ({ default: module.TripScreen })));

/** Loads the screen only when the route is opened; keeps the existing skeleton while waiting. */
export function TripScreen({ tripId, sub }: { readonly tripId: string; readonly sub: string | null }) {
  return <Suspense fallback={<ScreenSkeleton />}><Content tripId={tripId} sub={sub} /></Suspense>;
}
