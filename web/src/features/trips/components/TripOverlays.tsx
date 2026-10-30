import type { Overlay } from '../hooks/TripViewContext.tsx';
import type { MealGapEditor } from '../model/mealGaps.ts';
import { DeleteTripSheet } from './DeleteTripSheet.tsx';
import { lazy, Suspense } from 'react';
import { ItemEditorSheet } from './ItemEditorSheet.tsx';
import { RequestDeleteSheet, RequestsSheet } from './RequestsSheet.tsx';
import { AddItemSheet, AddToDaySheet, AutoPlanSheet, PickDaySheet } from './TripSheets.tsx';

const CoverSheet = lazy(() => import('./CoverSheet.tsx').then(module => ({ default: module.CoverSheet })));
const EditTripSheet = lazy(() => import('./EditTripSheet.tsx').then(module => ({ default: module.EditTripSheet })));
const PeopleSheet = lazy(() => import('./PeopleSheet.tsx').then(module => ({ default: module.PeopleSheet })));
const TrashSheet = lazy(() => import('./TrashSheet.tsx').then(module => ({ default: module.TrashSheet })));
const MealSuggestSheet = lazy(() => import('./MealSuggestSheet.tsx').then(module => ({ default: module.MealSuggestSheet })));

/** Hiện đúng tờ phủ đang mở trên màn chuyến đi (mỗi lần một cái). `key` buộc dựng lại biểu mẫu khi đổi sang mục khác. */
export function TripOverlays({ overlay, onClose }: { readonly overlay: Overlay | MealGapEditor | null; readonly onClose: () => void }) {
  if (!overlay) return null;
  switch (overlay.kind) {
    case 'mealSuggest':
      return <Suspense fallback={null}><MealSuggestSheet key={`${overlay.day}:${overlay.gap}`} day={overlay.day} gap={overlay.gap} onClose={onClose} /></Suspense>;
    case 'cover':
      return <Suspense fallback={null}><CoverSheet onClose={onClose} /></Suspense>;
    case 'add':
      return <AddItemSheet onClose={onClose} />;
    case 'editor':
      return <ItemEditorSheet key={JSON.stringify(overlay)} itemId={overlay.itemId} preset={overlay.preset} initial={'initial' in overlay ? overlay.initial : undefined} onClose={onClose} />;
    case 'editTrip':
      return <Suspense fallback={null}><EditTripSheet onClose={onClose} /></Suspense>;
    case 'plan':
      return <AutoPlanSheet onClose={onClose} />;
    case 'addToDay':
      return <AddToDaySheet onClose={onClose} />;
    case 'trash':
      return <Suspense fallback={null}><TrashSheet onClose={onClose} /></Suspense>;
    case 'deleteTrip':
      return <DeleteTripSheet onClose={onClose} />;
    case 'people':
      return <Suspense fallback={null}><PeopleSheet onClose={onClose} /></Suspense>;
    case 'requests':
      return <RequestsSheet onClose={onClose} />;
    case 'requestDelete':
      return <RequestDeleteSheet itemId={overlay.itemId} onClose={onClose} />;
    case 'pickDay':
      return <PickDaySheet itemId={overlay.itemId} onClose={onClose} />;
  }
}
