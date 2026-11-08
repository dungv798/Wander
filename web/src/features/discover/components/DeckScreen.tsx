import { lazy, Suspense } from 'react';
import { ScreenSkeleton } from '../../../shared/ui/Skeleton.tsx';
import type { AddingMode } from '../model/addingMode.ts';

const Content = lazy(() => import('./DeckScreenContent.tsx').then(module => ({ default: module.DeckScreen })));

/** Chỉ tải màn khi mở tuyến; giữ khung xương sẵn có trong lúc chờ. */
export function DeckScreen({ destId, adding }: { readonly destId: string; readonly adding?: AddingMode }) {
  return <Suspense fallback={<ScreenSkeleton />}><Content destId={destId} adding={adding} /></Suspense>;
}
