import { lazy, Suspense } from 'react';
import { ScreenSkeleton } from '../../../shared/ui/Skeleton.tsx';

const Content = lazy(() => import('./ExportScreenContent.tsx').then(module => ({ default: module.ExportScreen })));

/** Chỉ nạp màn xuất khi mở tuyến, luôn có khung xương trong lúc chờ chunk. */
export function ExportScreen({ tripId }: { readonly tripId: string }) {
  return <Suspense fallback={<ScreenSkeleton />}><Content tripId={tripId} /></Suspense>;
}
