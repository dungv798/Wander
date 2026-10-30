import { Button } from '../../../shared/ui/Button.tsx';
import { useTripView } from '../hooks/TripViewContext.tsx';
import { mealGapEditor } from '../model/mealGaps.ts';
import type { MealGap } from '../model/mealGaps.ts';
import { MEAL_SUGGEST_ENTRY_COPY as C } from '../model/mealSuggest.copy.ts';

/** Tải lựa chọn và copy sau khi người dùng mở nhắc; chưa nạp danh sách POI. */
export function MealSuggestEntry({ day, gap }: { readonly day: string; readonly gap: MealGap }) {
  const { setOverlay } = useTripView();
  return <>
    <Button kind="ghost" icon="map-pin" onClick={() => setOverlay({ kind: 'mealSuggest', day, gap })}>{C.suggest}</Button>
    <Button kind="ghost" icon="plus" onClick={() => setOverlay(mealGapEditor(gap, day))}>{C.manual}</Button>
  </>;
}
