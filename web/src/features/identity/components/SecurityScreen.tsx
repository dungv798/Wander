import { lazy, Suspense } from 'react';
import { ScreenSkeleton } from '../../../shared/ui/Skeleton.tsx';

const Content = lazy(() => import('./SecurityScreenContent.tsx').then(module => ({ default: module.SecurityScreen })));

/** Chỉ tải màn khi mở tuyến và giữ khung xương trong lúc chờ. */
export function SecurityScreen() {
  return <Suspense fallback={<ScreenSkeleton />}><Content /></Suspense>;
}

const Retry = lazy(() => import('./SecurityScreenContent.tsx').then(module => ({ default: module.RetryState })));

/** Giữ trạng thái thử lại dùng chung bên trong ranh giới tải lười. */
export function RetryState() {
  return <Suspense fallback={<ScreenSkeleton />}><Retry /></Suspense>;
}
