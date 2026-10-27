import { COPY, fill } from '../../../../shared/const/copy.vi.ts';
import { UI } from '../../../../shared/const/app.const.ts';
import { VIEW } from '../../../../shared/const/routes.const.ts';
import { cssVars } from '../../../../shared/lib/cssVars.ts';
import { monthRangeLabel } from '../../../../shared/lib/text.ts';
import { navigate } from '../../../../shared/router/hashRoute.ts';
import { Chip } from '../../../../shared/ui/Chip.tsx';
import { Icon } from '../../../../shared/ui/Icon.tsx';
import { SectionHead } from '../../../../shared/ui/SectionHead.tsx';
import { usePlaceSheet } from '../../hooks/PlaceSheetProvider.tsx';
import { useDiscover } from '../../hooks/DiscoverProvider.tsx';
import { CATEGORY_ICON, COMING_SOON, HOME_PLACES } from '../../model/discover.const.ts';
import type { DestinationDetail, PlaceView } from '../../model/Catalog.types.ts';
import { destBestMonths, firstPhotoUrl, groupByCategory, placeById, placesInSeason } from '../../model/destinationQueries.ts';
import { pickedOf } from '../../model/discoverState.ts';

interface SectionProps {
  readonly dest: DestinationDetail;
}

/** Thẻ "Đang chọn dở": nhắc người dùng còn các nơi đã quẹt phải chưa lưu thành chuyến đi. */
export function ResumeSection({ dest }: SectionProps) {
  const { state } = useDiscover();
  const picked = pickedOf(state, dest.places);
  const first = picked[0];
  if (!first) return null;
  return (
    <section className="stack">
      <h2 className="h2">{COPY.home.resumeTitle}</h2>
      <button className="resume" type="button" onClick={() => navigate(VIEW.PICKED)}>
        <img alt="" src={firstPhotoUrl(first)} />
        <div>
          <h3>{fill(COPY.home.resumeCount, { n: picked.length })}</h3>
          <p>{fill(COPY.home.resumeSub, { dest: dest.name })}</p>
        </div>
        <span className="chip tint cat-canh">{COPY.home.resumeAction}</span>
      </button>
    </section>
  );
}

/** Hàng "Bạn đang mê gì?": mỗi loại một ảnh thật và số nơi; chạm để quẹt riêng loại đó. */
export function MoodSection({ dest }: SectionProps) {
  const { actions } = useDiscover();
  const groups = [...groupByCategory(dest).entries()];
  return (
    <section className="stack rv">
      <SectionHead title={COPY.home.moods} />
      <div className="hscroll moods">
        {groups.map(([cat, list]) => (
          <button
            key={cat}
            className="mood"
            type="button"
            onClick={() => {
              actions.setCategory(cat);
              navigate(VIEW.DECK, dest.id);
            }}
          >
            <img alt="" src={firstPhotoUrl(list[0])} loading="lazy" />
            <span className="mood-in">
              <span className="mood-ic">
                <Icon name={CATEGORY_ICON[cat]} />
              </span>
              <b>{list[0]?.categoryName}</b>
              <span>{fill(COPY.common.placeCountShort, { n: list.length })}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

/** Hàng "Nên đi tháng này": chỉ các nơi đang vào mùa đẹp theo kho biên tập (không bịa mùa). */
export function MonthSection({ dest }: SectionProps) {
  const { open } = usePlaceSheet();
  const list = placesInSeason(dest, new Date().getMonth() + 1).slice(0, UI.MONTH_LIMIT);
  if (!list.length) return null;
  return (
    <section className="stack rv">
      <SectionHead title={COPY.home.month} />
      <div className="monthrow">
        {list.map((p, i) => (
          <button key={p.id} className={`mcard cat-${p.category}`} type="button" onClick={() => open(p.id)} style={cssVars({ d: `${i * UI.STAGGER_MS}ms` })}>
            <img alt="" src={firstPhotoUrl(p)} />
            <span className="mc-badge">
              <Icon name="calendar-event" size="s" />
              {p.bestLabel}
            </span>
            <span className="mc-in">
              <b>{p.name}</b>
              <span>{p.area}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

/** Tường ảnh "Những nơi làm người ta muốn đi" (chỉ màn rộng). */
export function WallSection({ dest }: SectionProps) {
  const { open } = usePlaceSheet();
  const wall = HOME_PLACES.WALL.map((id) => placeById(dest, id)).filter((p): p is PlaceView => p !== null);
  return (
    <section className="stack rv">
      <SectionHead title={COPY.home.wall} />
      <div className="wall">
        {wall.map((p, i) => (
          <button key={p.id} className={`wcell w${i} cat-${p.category}`} type="button" onClick={() => open(p.id)} style={cssVars({ d: `${i * UI.STAGGER_WALL_MS}ms` })}>
            <img alt="" src={firstPhotoUrl(p)} loading="lazy" />
            <span className="wc-in">
              <Chip tone="glass" icon={CATEGORY_ICON[p.category]}>
                {p.categoryName}
              </Chip>
              <b>{p.name}</b>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

/** Thẻ lớn "Khám phá ngay" dẫn tới cẩm nang điểm đến. */
export function DestinationCardSection({ dest }: SectionProps) {
  const months = monthRangeLabel(destBestMonths(dest)).toLowerCase();
  return (
    <section className="stack rv">
      <SectionHead title={COPY.home.discover} />
      <button className="dcard" type="button" onClick={() => navigate(VIEW.DEST, dest.id)}>
        <img alt="" src={dest.coverUrl} />
        <span className="pill cta">{COPY.home.viewGuide}</span>
        <div className="dcard-in">
          <h3>{dest.name}</h3>
          <div className="row">
            <Chip tone="glass" icon="map-pin">{fill(COPY.common.placeCount, { n: dest.places.length })}</Chip>
            {months ? <Chip tone="glass" icon="calendar-event">{fill(COPY.home.bestMonth, { months })}</Chip> : null}
          </div>
        </div>
      </button>
    </section>
  );
}

/** Hàng "Nổi bật" khi đang tìm kiếm: mở nhanh chi tiết các nơi tiêu biểu. */
export function FeaturedSection({ dest }: SectionProps) {
  const { open } = usePlaceSheet();
  const list = HOME_PLACES.HIGHLIGHTS.map((id) => placeById(dest, id)).filter((p): p is PlaceView => p !== null);
  return (
    <section className="stack rv">
      <SectionHead title={fill(COPY.home.featured, { dest: dest.name })} />
      <div className="hscroll">
        {list.map((p) => (
          <button key={p.id} className={`mini cat-${p.category}`} type="button" onClick={() => open(p.id)}>
            <img alt="" src={firstPhotoUrl(p)} />
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

/** Danh sách "Sắp ra mắt" (chỉ tên; chưa có dữ liệu thật). `names` đã lọc theo tìm kiếm. */
export function SoonSection({ names }: { readonly names: readonly string[] }) {
  if (!names.length) return null;
  return (
    <section className="stack">
      <h2 className="h2">{COPY.home.soon}</h2>
      <div className="soon">
        {names.map((n) => (
          <span key={n}>{n}</span>
        ))}
      </div>
    </section>
  );
}

/** Mọi tên "Sắp ra mắt" (để bộ lọc tìm kiếm dùng). */
export const SOON_NAMES: readonly string[] = COMING_SOON;
