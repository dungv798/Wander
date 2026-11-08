import { lazy, Suspense } from 'react';
import { ScreenSkeleton } from '../../../shared/ui/Skeleton.tsx';

const Content = lazy(() => import('./TripScreenContent.tsx').then(module => ({ default: module.TripScreen })));

/** Chỉ tải màn khi mở tuyến; giữ khung xương sẵn có trong lúc chờ. */
export function TripScreen({ tripId, sub }: { readonly tripId: string; readonly sub: string | null }) {
  return <Suspense fallback={<ScreenSkeleton />}><Content tripId={tripId} sub={sub} /></Suspense>;
}
