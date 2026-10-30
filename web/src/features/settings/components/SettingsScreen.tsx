import { lazy, Suspense } from 'react';
import { ScreenSkeleton } from '../../../shared/ui/Skeleton.tsx';

const Content = lazy(() => import('./SettingsScreenContent.tsx').then(module => ({ default: module.SettingsScreen })));

/** Chỉ tải màn khi mở tuyến và giữ khung xương trong lúc chờ. */
export function SettingsScreen() {
  return <Suspense fallback={<ScreenSkeleton />}><Content /></Suspense>;
}
