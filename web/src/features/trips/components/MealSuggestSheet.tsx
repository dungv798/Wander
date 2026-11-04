import { useMemo, useState } from 'react';
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
import { dayAnchors, displayKind, formatDistance, rankPoi } from '../model/poiRank.ts';
import { MEAL_GAPS_COPY as M } from '../model/mealGaps.copy.ts';
import './mealSuggest.css';

/** Liên kết xem một quán trên OpenStreetMap (nguồn dữ liệu của gợi ý); mở tab mới, không rời lịch. */
function poiMapHref(poi: PoiSuggestion): string {
  return `https://www.openstreetmap.org/?mlat=${poi.lat}&mlon=${poi.lon}#map=18/${poi.lat}/${poi.lon}`;
}

/** Thẻ quán: tên, loại (đã đối chiếu tên), lý do gợi ý (khoảng cách tới mốc), địa chỉ, giờ nguồn chưa kiểm; hai hành động: thêm vào bữa và xem bản đồ. Không có ảnh/giá/rating vì nguồn không có. */
function PoiCard({ poi, anchor, gap, onSelect }: { readonly poi: PoiSuggestion; readonly anchor: string; readonly gap: MealGap; readonly onSelect: () => void }) {
  const kind = displayKind(poi);
  return <li className="meal-poi-row">
    <div className="meal-poi" data-kind={kind}>
      <span className="meal-poi-icon"><Icon name={kind === 'cafe' ? 'bowl' : 'tools-kitchen-2'} size="l" /></span>
      <span className="meal-poi-body">
        <strong>{poi.name}</strong>
        <span className="note">{C.kinds[kind]}</span>
        <span className="meal-distance" data-distance-m={poi.distanceM}>{fill(C.distance, { anchor, distance: formatDistance(poi.distanceM) })}</span>
        {poi.address ? <span className="note">{poi.address}</span> : null}
        {poi.openingHoursRaw ? <span className="note">{fill(C.hours, { raw: poi.openingHoursRaw })}</span> : null}
      </span>
    </div>
    <div className="meal-poi-actions">
      <Button kind="ghost" icon="plus" aria-label={fill(C.addTo, { gap: M[gap].short.toLowerCase(), name: poi.name })} onClick={onSelect}>{fill(C.addShort, { gap: M[gap].short.toLowerCase() })}</Button>
      <a className="btn ghost glass-control" href={poiMapHref(poi)} target="_blank" rel="noopener noreferrer" aria-label={fill(C.viewMapAria, { name: poi.name })}><Icon name="map-pin" size="s" />{C.viewMap}</a>
    </div>
  </li>;
}

/** Chọn "Gần điểm nào": các mốc có tọa độ trong ngày và trọng tâm; mốc mặc định được nêu rõ bằng giá trị đang chọn. */
function AnchorPicker({ options, value, onChange }: { readonly options: readonly { readonly key: string; readonly name: string }[]; readonly value: string; readonly onChange: (key: string) => void }) {
  if (options.length < R.minAnchors) return null;
  return <label className="field">{C.anchorLabel}
    <select value={value} onChange={(e) => onChange(e.target.value)}>{options.map((o) => <option key={o.key} value={o.key}>{o.name}</option>)}</select>
  </label>;
}

/** Tờ tải lười gợi ý theo ngày: top vài quán gần mốc chọn, xếp theo loại bữa; chọn quán chỉ mở bản nháp, việc lưu do trình sửa hiện có xử lý. */
export function MealSuggestSheet({ day, gap, onClose }: { readonly day: string; readonly gap: MealGap; readonly onClose: () => void }) {
  const { trip, cat, setOverlay } = useTripView();
  const options = useMemo(() => dayAnchors(trip.items, day, cat.place, C.centroid), [trip.items, day, cat]);
  const base = mealAnchor(trip.items, day, gap, cat.place);
  const [pick, setPick] = useState<string | null>(null);
  const defaultKey = options.find((o) => base && o.lat === base.lat && o.lon === base.lon)?.key ?? options[0]?.key ?? '';
  const chosen = options.find((o) => o.key === (pick ?? defaultKey));
  const anchor = chosen ?? base;
  const [radius, setRadius] = useState<number>(R.radiusM);
  const [all, setAll] = useState(false);
  const { result, retry } = useMealSuggestions(trip.destinationId, mealPoiKind(gap), anchor, radius);
  /** Bán kính đổi cùng trạng thái tải để danh sách cũ không còn bấm được. */
  const expand = (): void => { retry(); setRadius(R.expandedRadiusM); };
  const ranked = result.status === 'ready' ? rankPoi(result.poi, gap) : [];
  const shown = all ? ranked : ranked.slice(0, R.previewCount);
  return <Sheet label={C.title} onClose={onClose}>
    <div className="meal-suggest pp">
      <div className="meal-suggest-header"><h2>{C.title}</h2><Button kind="ghost" onClick={onClose}>{C.close}</Button></div>
      <AnchorPicker options={options} value={pick ?? defaultKey} onChange={(key) => { setPick(key); setAll(false); }} />
      {anchor ? <p className="note">{fill(C.near, { anchor: anchor.name })} {C.estimate}</p> : <p role="status">{C.noCoordinates}</p>}
      <div className="meal-suggest-results" aria-busy={!!anchor && result.status === 'loading'}>
        {anchor && result.status === 'loading' ? <div role="status" aria-label={C.loading} className="stack">
          {Array.from({ length: R.skeletons }, (_, i) => <div key={i} className="meal-skeleton" />)}
        </div> : null}
        {anchor && result.status === 'error' ? <p role="alert">{result.message}</p> : null}
        {anchor && result.status === 'ready' && !result.poi.length ? <p role="status">{C.empty}</p> : null}
        {anchor && result.status === 'ready' ? <ul className="meal-poi-list">{shown.map((poi) => <PoiCard key={poi.id} poi={poi} anchor={anchor.name} gap={gap} onSelect={() => setOverlay(poiEditor(gap, day, poi))} />)}</ul> : null}
        {anchor && result.status === 'ready' && result.poi.length > 0 && result.poi.length < R.fewResults ? <p className="note" role="status">{fill(C.few, { n: result.poi.length })}</p> : null}
      </div>
      <div className="meal-suggest-actions">
        {ranked.length > R.previewCount && !all ? <Button kind="ghost" onClick={() => setAll(true)}>{fill(C.seeAll, { n: ranked.length })}</Button> : null}
        {anchor && (result.status === 'error' || (result.status === 'ready' && !result.poi.length)) ? <Button kind="ghost" onClick={retry}>{C.retry}</Button> : null}
        {anchor && radius < R.expandedRadiusM ? <Button kind="ghost" onClick={expand}>{C.expand}</Button> : null}
        <Button kind="ghost" onClick={() => setOverlay(mealGapEditor(gap, day))}>{C.manual}</Button>
      </div>
      <footer className="meal-attribution note"><span>{C.attribution}</span><a href={C.licenseUrl} target="_blank" rel="noreferrer">{C.license}</a></footer>
    </div>
  </Sheet>;
}
