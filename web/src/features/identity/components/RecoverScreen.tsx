import { lazy, Suspense } from 'react';
import { ScreenSkeleton } from '../../../shared/ui/Skeleton.tsx';

const Content = lazy(() => import('./RecoverScreenContent.tsx').then(module => ({ default: module.RecoverScreen })));

/** Chỉ tải màn khi mở tuyến và giữ khung xương trong lúc chờ. */
export function RecoverScreen() {
  return <Suspense fallback={<ScreenSkeleton />}><Content /></Suspense>;
}
