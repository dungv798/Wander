import { lazy, Suspense } from 'react';
import { ScreenSkeleton } from '../../../shared/ui/Skeleton.tsx';

const Content = lazy(() => import('./SettingsScreenContent.tsx').then(module => ({ default: module.SettingsScreen })));

/** Loads the screen only when the route is opened and keeps a skeleton while waiting. */
export function SettingsScreen() {
  return <Suspense fallback={<ScreenSkeleton />}><Content /></Suspense>;
}
