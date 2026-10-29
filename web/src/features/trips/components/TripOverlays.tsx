import type { Overlay } from '../hooks/TripViewContext.tsx';
import type { MealGapEditor } from '../model/mealGaps.ts';
import { DeleteTripSheet } from './DeleteTripSheet.tsx';
import { EditTripSheet } from './EditTripSheet.tsx';
import { ItemEditorSheet } from './ItemEditorSheet.tsx';
import { PeopleSheet } from './PeopleSheet.tsx';
import { RequestDeleteSheet, RequestsSheet } from './RequestsSheet.tsx';
import { TrashSheet } from './TrashSheet.tsx';
import { AddItemSheet, AddToDaySheet, AutoPlanSheet, PickDaySheet } from './TripSheets.tsx';

/** Hiện đúng tờ phủ đang mở trên màn chuyến đi (mỗi lần một cái). `key` buộc dựng lại biểu mẫu khi đổi sang mục khác. */
export function TripOverlays({ overlay, onClose }: { readonly overlay: Overlay | MealGapEditor | null; readonly onClose: () => void }) {
  if (!overlay) return null;
  switch (overlay.kind) {
    case 'add':
      return <AddItemSheet onClose={onClose} />;
    case 'editor':
      return <ItemEditorSheet key={JSON.stringify(overlay)} itemId={overlay.itemId} preset={overlay.preset} initial={'initial' in overlay ? overlay.initial : undefined} onClose={onClose} />;
    case 'editTrip':
      return <EditTripSheet onClose={onClose} />;
    case 'plan':
      return <AutoPlanSheet onClose={onClose} />;
    case 'addToDay':
      return <AddToDaySheet onClose={onClose} />;
    case 'trash':
      return <TrashSheet onClose={onClose} />;
    case 'deleteTrip':
      return <DeleteTripSheet onClose={onClose} />;
    case 'people':
      return <PeopleSheet onClose={onClose} />;
    case 'requests':
      return <RequestsSheet onClose={onClose} />;
    case 'requestDelete':
      return <RequestDeleteSheet itemId={overlay.itemId} onClose={onClose} />;
    case 'pickDay':
      return <PickDaySheet itemId={overlay.itemId} onClose={onClose} />;
  }
}
