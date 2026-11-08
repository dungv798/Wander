import { lazy, Suspense } from 'react';
import { ScreenSkeleton } from '../../../shared/ui/Skeleton.tsx';

const Content = lazy(() => import('./TodayScreenContent.tsx').then(module => ({ default: module.TodayScreen })));

/** Chỉ tải màn khi mở tuyến; giữ khung xương sẵn có trong lúc chờ. */
export function TodayScreen({ tripId }: { readonly tripId: string | null }) {
  return <Suspense fallback={<ScreenSkeleton />}><Content tripId={tripId} /></Suspense>;
}
