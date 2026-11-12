import { lazy, Suspense } from 'react';
import { ScreenSkeleton } from '../../../shared/ui/Skeleton.tsx';

const Content = lazy(() => import('./ExportScreenContent.tsx').then(module => ({ default: module.ExportScreen })));

/** Loads the export screen only when the route is opened, always with a skeleton while waiting for the chunk. */
export function ExportScreen({ tripId }: { readonly tripId: string }) {
  return <Suspense fallback={<ScreenSkeleton />}><Content tripId={tripId} /></Suspense>;
}
