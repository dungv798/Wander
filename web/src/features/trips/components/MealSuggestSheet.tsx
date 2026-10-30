import { useState } from 'react';
import { fill } from '../../../shared/const/copy.vi.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { Icon } from '../../../shared/ui/Icon.tsx';
import { Sheet } from '../../../shared/ui/Sheet.tsx';
import { useTripView } from '../hooks/TripViewContext.tsx';
import { useMealSuggestions } from '../hooks/useMealSuggestions.ts';
import type { PoiSuggestion } from '../api/poi.api.ts';
import { mealGapEditor } from '../model/mealGaps.ts';
import type { MealGap } from '../model/mealGaps.ts';
import { mealAnchor, mealPoiKind, poiEditor } from '../model/mealSuggest.ts';
import { MEAL_SUGGEST_COPY as C } from '../model/mealSuggest.copy.ts';
import { MEAL_SUGGEST as R } from '../model/mealSuggest.const.ts';
import './mealSuggest.css';

/** Thẻ quán không ảnh/rating; chỉ công bố khoảng cách chim bay và giờ nguồn chưa kiểm tra. */
function PoiCard({ poi, anchor, onSelect }: { readonly poi: PoiSuggestion; readonly anchor: string; readonly onSelect: () => void }) {
  return <button type="button" className="meal-poi" onClick={onSelect}>
    <span className="meal-poi-icon"><Icon name={poi.kind === 'cafe' ? 'bowl' : 'tools-kitchen-2'} size="l" /></span>
    <span className="meal-poi-body">
      <strong>{poi.name}</strong>
      <span className="note">{C.kinds[poi.kind]}</span>
      <span className="meal-distance" data-distance-m={poi.distanceM}>{fill(C.distance, { anchor, distance: Math.round(poi.distanceM) })}</span>
      {poi.address ? <span className="note">{poi.address}</span> : null}
      {poi.openingHoursRaw ? <span className="note">{fill(C.hours, { raw: poi.openingHoursRaw })}</span> : null}
    </span>
    <Icon name="plus" size="s" />
  </button>;
}

/** Tờ tải lười gợi ý theo ngày; chọn quán chỉ mở bản nháp, việc lưu do editor hiện có xử lý. */
export function MealSuggestSheet({ day, gap, onClose }: { readonly day: string; readonly gap: MealGap; readonly onClose: () => void }) {
  const { trip, cat, setOverlay } = useTripView();
  const anchor = mealAnchor(trip.items, day, gap, cat.place);
  const [radius, setRadius] = useState<number>(R.radiusM);
  const { result, retry } = useMealSuggestions(trip.destinationId, mealPoiKind(gap), anchor, radius);
  /** Bán kính đổi cùng trạng thái tải để danh sách cũ không còn bấm được. */
  const expand = (): void => { retry(); setRadius(R.expandedRadiusM); };
  return <Sheet label={C.title} onClose={onClose}>
    <div className="meal-suggest pp">
      <div className="meal-suggest-header"><h2>{C.title}</h2><Button kind="ghost" onClick={onClose}>{C.close}</Button></div>
      {anchor ? <p className="note">{C.estimate}</p> : <p role="status">{C.noCoordinates}</p>}
      <div className="meal-suggest-results" aria-busy={!!anchor && result.status === 'loading'}>
        {anchor && result.status === 'loading' ? <div role="status" aria-label={C.loading} className="stack">
          {Array.from({ length: R.skeletons }, (_, i) => <div key={i} className="meal-skeleton" />)}
        </div> : null}
        {anchor && result.status === 'error' ? <p role="alert">{result.message}</p> : null}
        {anchor && result.status === 'ready' && !result.poi.length ? <p role="status">{C.empty}</p> : null}
        {anchor && result.status === 'ready' ? result.poi.map(poi => <PoiCard key={poi.id} poi={poi} anchor={anchor.name} onSelect={() => setOverlay(poiEditor(gap, day, poi))} />) : null}
      </div>
      <div className="meal-suggest-actions">
        {anchor && (result.status === 'error' || (result.status === 'ready' && !result.poi.length)) ? <Button kind="ghost" onClick={retry}>{C.retry}</Button> : null}
        {anchor && radius < R.expandedRadiusM ? <Button kind="ghost" onClick={expand}>{C.expand}</Button> : null}
        <Button kind="ghost" onClick={() => setOverlay(mealGapEditor(gap, day))}>{C.manual}</Button>
      </div>
      <footer className="meal-attribution note"><span>{C.attribution}</span><a href={C.licenseUrl} target="_blank" rel="noreferrer">{C.license}</a></footer>
    </div>
  </Sheet>;
}
