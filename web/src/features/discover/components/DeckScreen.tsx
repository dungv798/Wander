import { lazy, Suspense } from 'react';
import { ScreenSkeleton } from '../../../shared/ui/Skeleton.tsx';
import type { AddingMode } from '../model/addingMode.ts';

const Content = lazy(() => import('./DeckScreenContent.tsx').then(module => ({ default: module.DeckScreen })));

/** Loads the screen only when the route is opened; keeps the existing skeleton while waiting. */
export function DeckScreen({ destId, adding }: { readonly destId: string; readonly adding?: AddingMode }) {
  return <Suspense fallback={<ScreenSkeleton />}><Content destId={destId} adding={adding} /></Suspense>;
}
