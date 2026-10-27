import { useMemo } from 'react';
import { COPY, fill } from '../../../shared/const/copy.vi.ts';
import { roadKmBetween } from '../../../shared/lib/geo.ts';
import { TerrainMapView } from '../../../shared/map/TerrainMapView.tsx';
import type { MapFit } from '../../../shared/map/TerrainMapView.tsx';
import { Compass, Plane, Sun } from '../../../shared/ui/art/Art.tsx';
import { Icon } from '../../../shared/ui/Icon.tsx';
import { firstPhotoUrl, placeById, placeMarkers } from '../../discover/index.ts';
import type { DestinationDetail, PlaceView } from '../../discover/index.ts';
import { COUNTER_STEPS, PLAN_DEMO, PLAN_MAP_PADDING, SWIPE_DEMO, SWIPE_DEMO_SKIPPED } from '../model/onboarding.const.ts';
import { ONBOARD_COPY as T } from '../model/onboarding.copy.ts';

/** Các địa điểm có thật trong kho theo danh sách mã (mã thiếu bị bỏ, cảnh vẫn dựng được). */
function placesOf(dest: DestinationDetail, ids: readonly string[]): PlaceView[] {
  return ids.flatMap((id) => placeById(dest, id) ?? []);
}

/** Cảnh 1: thẻ ảnh lớn nghiêng nhẹ trên nền trời, ba "sự thật" từ kho nổi lên, máy bay lướt, la bàn xoay. */
export function InviteScene({ dest, place }: { readonly dest: DestinationDetail; readonly place: PlaceView | null }) {
  return (
    <div className="obs obs-invite">
      <div className="obs-sunbg">
        <Sun className="sun3d" />
      </div>
      <figure className="obs-hero">{place ? <img alt="" src={firstPhotoUrl(place)} fetchPriority="high" /> : null}</figure>
      {place ? (
        <>
          <span className="obs-fact f1" style={{ '--k': 0 } as React.CSSProperties}>
            <Icon name="map-pin" size="s" />
            {place.name}
          </span>
          <span className="obs-fact f2" style={{ '--k': 1 } as React.CSSProperties}>
            <Icon name="calendar-event" size="s" />
            {fill(T.factBest, { months: place.bestLabel.toLowerCase() })}
          </span>
        </>
      ) : null}
      <span className="obs-fact f3" style={{ '--k': 2 } as React.CSSProperties}>
        <Icon name="hand-finger" size="s" />
        {fill(T.factCount, { n: dest.places.length })}
      </span>
      <Plane />
      <Compass className="compass obs-compass" />
    </div>
  );
}

/** Cảnh 2: bộ bài tự quẹt (phải = chọn, trái = bỏ qua), bàn tay chạy theo thẻ, bộ đếm "Đã chọn" nhảy số. Ba thẻ đầu của `SWIPE_DEMO`. */
export function SwipeScene({ dest }: { readonly dest: DestinationDetail }) {
  const cards = placesOf(dest, SWIPE_DEMO);
  return (
    <div className="obs obs-swipe">
      <div className="obs-deck">
        {cards
          .map((p, i) => {
            const skip = i === SWIPE_DEMO_SKIPPED;
            return (
              <figure key={p.id} className={`obs-card c${i + 1}`}>
                <img alt="" src={firstPhotoUrl(p)} />
                <figcaption>{p.name}</figcaption>
                <span className={`obs-stamp ${skip ? 'no' : 'yes'}`}>
                  <Icon name={skip ? 'x' : 'check'} />
                </span>
              </figure>
            );
          })
          .reverse()}
        <span className="obs-hand">
          <Icon name="hand-finger" size="xl" />
        </span>
      </div>
      <div className="obs-count">
        <Icon name="bookmarks" size="s" />
        {T.selected}
        <span className="obs-n">
          {COUNTER_STEPS.map((n) => (
            <i key={n} className={`n${n}`}>
              {n}
            </i>
          ))}
        </span>
      </div>
    </div>
  );
}

/** Cảnh 3: bản đồ địa hình thật vẽ tuyến ngày 1 (ghim rơi, đường vẽ dần), dưới là hai ngày xếp sẵn. */
export function PlanScene({ dest }: { readonly dest: DestinationDetail }) {
  const days = useMemo(() => PLAN_DEMO.map((ids) => placesOf(dest, ids)), [dest]);
  const first = useMemo(() => days[0] ?? [], [days]);
  const markers = useMemo(() => placeMarkers(first).map((m, i) => ({ ...m, num: i + 1 })), [first]);
  const route = useMemo(() => {
    const labels = first.slice(1).map((p, i) => {
      const a = first[i];
      return a && a.lat !== null && a.lon !== null && p.lat !== null && p.lon !== null ? fill(COPY.units.kmApprox, { km: Math.round(roadKmBetween({ lat: a.lat, lon: a.lon }, { lat: p.lat, lon: p.lon })) }) : '';
    });
    return { ids: first.map((p) => p.id), labels };
  }, [first]);
  const fit = useMemo<MapFit>(() => ({ ids: null, options: { animate: false, padding: PLAN_MAP_PADDING } }), []);
  let k = 0;
  return (
    <div className="obs obs-plan">
      <div className="obs-map">
        <TerrainMapView dest={dest.id} label={T.mapLabel} markers={markers} route={route} mode="route" fit={fit} interactive={false} towns={false} credit={false} />
      </div>
      <div className="obs-days">
        {days.map((list, d) => (
          <section key={`day-${d}`} className="obs-day">
            <h3>{fill(T.day, { n: d + 1 })}</h3>
            <div className="obs-chips">
              {list.map((p) => (
                <span key={p.id} className="obs-stop" style={{ '--k': k++ } as React.CSSProperties}>
                  <img alt="" src={firstPhotoUrl(p)} />
                  <b>{p.name}</b>
                </span>
              ))}
            </div>
          </section>
        ))}
        <p className="obs-done" style={{ '--k': k } as React.CSSProperties}>
          <Icon name="check" size="s" />
          {T.planDone}
        </p>
      </div>
    </div>
  );
}
