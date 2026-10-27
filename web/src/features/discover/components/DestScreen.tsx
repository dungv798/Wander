import { COPY, fill } from '../../../shared/const/copy.vi.ts';
import { VIEW } from '../../../shared/const/routes.const.ts';
import { useCountUp } from '../../../shared/hooks/useCountUp.ts';
import { useReveal } from '../../../shared/hooks/useReveal.ts';
import { monthRangeLabel } from '../../../shared/lib/text.ts';
import { navigate } from '../../../shared/router/hashRoute.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { Icon } from '../../../shared/ui/Icon.tsx';
import { IconButton } from '../../../shared/ui/IconButton.tsx';
import { usePlaceSheet } from '../hooks/PlaceSheetProvider.tsx';
import { COVER_FOCAL, DEFAULT_FOCAL, CATEGORY_ICON } from '../model/discover.const.ts';
import type { DestinationDetail } from '../model/Catalog.types.ts';
import { categoriesOf, coverPlace, destBestMonths, firstPhotoUrl } from '../model/destinationQueries.ts';
import { DestinationGate } from './DestinationGate.tsx';
import { GuideSections } from './dest/GuideSections.tsx';
import { DestMapSection } from './map/DestMapSection.tsx';

/** Một số trong "Tóm tắt": đếm từ 0 lên khi hiện (giảm chuyển động thì hiện ngay). */
function FactNumber({ value }: { readonly value: number }) {
  return <b>{useCountUp(value)}</b>;
}

/** Ba số nhanh của điểm đến, đều tính từ kho biên tập: số nơi, mùa đẹp chung, số loại trải nghiệm. */
function DestFacts({ dest }: { readonly dest: DestinationDetail }) {
  const months = monthRangeLabel(destBestMonths(dest), '');
  return (
    <ul className="dfacts" aria-label={COPY.dest.factsLabel}>
      <li>
        <span className="ib">
          <Icon name="map-pin" />
        </span>
        <FactNumber value={dest.places.length} />
        <span>{COPY.dest.factPlaces}</span>
      </li>
      <li>
        <span className="ib">
          <Icon name="calendar-event" />
        </span>
        <b>{months}</b>
        <span>{COPY.dest.factBestMonths}</span>
      </li>
      <li>
        <span className="ib">
          <Icon name="sparkles" />
        </span>
        <FactNumber value={categoriesOf(dest).length} />
        <span>{COPY.dest.factKinds}</span>
      </li>
    </ul>
  );
}

/** Dải ảnh "Xem trước các nơi": nối phần ảnh bìa với nội dung bên dưới, chạm để xem chi tiết từng nơi. */
function DestPeek({ dest }: { readonly dest: DestinationDetail }) {
  const { open } = usePlaceSheet();
  return (
    <section className="stack rv">
      <h2 className="h2">{COPY.dest.peek}</h2>
      <div className="hscroll peek">
        {dest.places.map((p) => (
          <button key={p.id} className={`mini cat-${p.category}`} type="button" onClick={() => open(p.id)}>
            <img alt="" src={firstPhotoUrl(p)} loading="lazy" />
            <span className="catbadge">
              <Icon name={CATEGORY_ICON[p.category]} />
            </span>
            <span className="in">
              <h3>{p.name}</h3>
              <p>{p.area}</p>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

/** Trang điểm đến: ảnh bìa, số nhanh, hai nút chính, xem trước các nơi và cẩm nang. */
function DestContent({ dest, onCreate }: { readonly dest: DestinationDetail; readonly onCreate: () => void }) {
  const ref = useReveal<HTMLDivElement>();
  const focal = COVER_FOCAL[coverPlace(dest)?.id ?? ''] ?? DEFAULT_FOCAL;
  return (
    <>
      <section className="dhero">
        <img alt="" src={dest.coverUrl} style={{ objectPosition: focal }} />
        <div className="top">
          <IconButton icon="chevron-left" label={COPY.common.back} onClick={() => navigate(VIEW.EXPLORE)} />
        </div>
        <div className="in">
          <p className="dhero-region">
            <Icon name="map-pin" size="s" />
            {dest.region}
          </p>
          <h1>{dest.name}</h1>
          <p className="dhero-tag">{dest.tagline}</p>
        </div>
      </section>
      <div ref={ref} className="dbody pad-x">
        <DestFacts dest={dest} />
        <div className="dcta">
          <Button icon="hand-finger" onClick={() => navigate(VIEW.DECK, dest.id)}>
            {COPY.home.startSwipe}
          </Button>
          <Button kind="ghost" icon="plus" onClick={onCreate}>
            {COPY.dest.createTrip}
          </Button>
        </div>
        <DestMapSection dest={dest} />
        <DestPeek dest={dest} />
        <h2 className="h2">{fill(COPY.dest.guideTitle, { dest: dest.name })}</h2>
        <GuideSections dest={dest} />
      </div>
    </>
  );
}

/** Màn điểm đến (cẩm nang). Ẩn thanh điều hướng trên điện thoại để ảnh bìa chiếm trọn đầu trang. */
export function DestScreen({ destId, onCreate }: { readonly destId: string; readonly onCreate: () => void }) {
  return <DestinationGate destId={destId}>{(dest) => <DestContent dest={dest} onCreate={onCreate} />}</DestinationGate>;
}
