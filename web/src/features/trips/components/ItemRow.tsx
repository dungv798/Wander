import { TRIP_IMAGES } from '../model/tripImages.const.ts';
import { fill } from '../../../shared/const/copy.vi.ts';
import { Icon } from '../../../shared/ui/Icon.tsx';
import { IconButton } from '../../../shared/ui/IconButton.tsx';
import { CATEGORY_ICON } from '../../discover/index.ts';
import { useFire } from '../hooks/useFire.ts';
import { useTrips } from '../hooks/TripsProvider.tsx';
import { useTripView } from '../hooks/TripViewContext.tsx';
import { ITEM_KINDS, QUICK_ASSIGN_DAYS } from '../model/trip.const.ts';
import type { TripItem } from '../model/trip.types.ts';
import { dayItems } from '../model/tripMath.ts';
import { itemName } from '../model/tripView.ts';
import { permissionsOf } from '../model/tripPermissions.ts';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';
import { ItemMeta } from './ItemMeta.tsx';

interface ItemRowProps {
  readonly item: TripItem;
  /** Số thứ tự trong ngày (hiện trên ảnh); null ở mục chưa có ngày. */
  readonly num: number | null;
  /** Hiện nút lên/xuống (chế độ sắp xếp); `first/last` để tắt nút ở biên. */
  readonly sort?: { readonly first: boolean; readonly last: boolean };
  /** Hiện hàng "Chọn ngày: [Ngày 1] [Ngày 2]…" (mục chưa có ngày). */
  readonly assignable?: boolean;
}

/** Hàng chọn nhanh ngày cho mục chưa có ngày. */
function AssignRow({ item }: { readonly item: TripItem }) {
  const { actions } = useTrips();
  const fire = useFire();
  const { trip, days, announce, setOverlay } = useTripView();
  return (
    <div className="assign">
      <span>{T.view.chooseDay}</span>
      {days.slice(0, QUICK_ASSIGN_DAYS).map((d, k) => (
        <button
          key={d}
          className="dchip"
          type="button"
          onClick={() => {
            fire(actions.assignDay(trip.id, item.id, d));
            announce(fill(T.pickDay.assigned, { n: k + 1 }));
          }}
        >
          {fill(T.view.day, { n: k + 1 })}
        </button>
      ))}
      {days.length > QUICK_ASSIGN_DAYS ? <button className="dchip" type="button" onClick={() => setOverlay({ kind: 'pickDay', itemId: item.id })}>{T.view.otherDay}</button> : null}
    </div>
  );
}

/** Chân thẻ: "Ngày" và "Giờ" của mục, bấm để đổi ngay (mở tờ chọn ngày / trình sửa) mà không phải mở cả thẻ. */
function ItemFoot({ item, name }: { readonly item: TripItem; readonly name: string }) {
  const { days, setOverlay } = useTripView();
  const dayIdx = item.day ? days.indexOf(item.day) : -1;
  return (
    <div className="irow-foot">
      <button className="btn ghost glass-control foot-act" type="button" aria-label={fill(T.view.footChangeDay, { name })} onClick={() => setOverlay({ kind: 'pickDay', itemId: item.id })}>
        <Icon name="calendar-event" size="s" />
        <span>{dayIdx >= 0 ? fill(T.view.day, { n: dayIdx + 1 }) : T.view.footNoDay}</span>
      </button>
      <button className="btn ghost glass-control foot-act" type="button" aria-label={fill(T.view.footChangeTime, { name })} onClick={() => setOverlay({ kind: 'editor', itemId: item.id, preset: null })}>
        <Icon name="clock" size="s" />
        <span>{item.timeOfDay ?? T.view.footAddTime}</span>
      </button>
    </div>
  );
}

/** Nút lên/xuống của chế độ sắp xếp (thay thế đầy đủ cho kéo thả; bàn phím và đọc màn hình dùng được). */
function MoveButtons({ item, name, sort }: { readonly item: TripItem; readonly name: string; readonly sort: { readonly first: boolean; readonly last: boolean } }) {
  const { actions } = useTrips();
  const fire = useFire();
  const { trip, cat, announce } = useTripView();
  const move = (dir: 'up' | 'down'): void => {
    fire(actions.moveItem(trip.id, item.id, dir));
    const peers = item.day ? dayItems(trip, item.day) : [];
    const at = peers.findIndex((i) => i.id === item.id);
    const next = Math.max(0, Math.min(peers.length - 1, at + (dir === 'up' ? -1 : 1)));
    announce(fill(T.view.announcePos, { name: itemName(item, cat), i: next + 1, n: peers.length }));
  };
  return (
    <div className="mv">
      <IconButton icon="arrow-up" label={fill(T.view.moveUp, { name })} aria-disabled={sort.first} onClick={() => (sort.first ? undefined : move('up'))} />
      <IconButton icon="arrow-down" label={fill(T.view.moveDown, { name })} aria-disabled={sort.last} onClick={() => (sort.last ? undefined : move('down'))} />
    </div>
  );
}

/** Một hàng mục trong chuyến: ảnh/biểu tượng (kèm số thứ tự), loại + khu vực, tên, câu dẫn, chip giờ/giá/đặt chỗ; việc cần làm có ô tích. */
export function ItemRow({ item, num, sort, assignable }: ItemRowProps) {
  const { actions } = useTrips();
  const fire = useFire();
  const { trip, cat, days, tab, openItem, announce } = useTripView();
  const place = cat.place(item.placeId);
  const kind = ITEM_KINDS[item.type];
  const name = itemName(item, cat);
  const dayIdx = item.day ? days.indexOf(item.day) : -1;
  const snippet = place ? place.hook : item.note;
  const isTask = item.type === 'task';
  const photo = place?.photos[0]?.url;
  const rowCls = ['irow', place ? `cat-${place.category}` : kind.cat, isTask && item.done ? 'done' : ''].filter(Boolean).join(' ');
  return (
    <div className="itinerary-stop">
      <div className={sort ? 'swipe sorting' : 'swipe'} data-item={item.id} data-tab={tab}>
        <button className={rowCls} type="button" onClick={() => openItem(item.id)} data-day-index={dayIdx}>
          <div className={photo ? 'im' : 'im ktile'}>
            {photo ? <img loading="lazy" decoding="async" width={TRIP_IMAGES.ITEM.width} height={TRIP_IMAGES.ITEM.height} alt="" src={photo} /> : <Icon semantic name={kind.icon} size="l" />}
            {num ? <b>{num}</b> : null}
          </div>
          <div className="tx">
            <span className="kind">
              <Icon semantic name={place ? CATEGORY_ICON[place.category] : kind.icon} size="s" />
              {place ? `${place.categoryName} · ${place.area}` : kind.label}
            </span>
            <h3 title={name}>{name}</h3>
            {snippet ? <p className="snip">{snippet}</p> : null}
            <ItemMeta item={item} people={trip.memberCount} />
          </div>
        </button>
        {isTask ? (
          <button
            className="taskchk"
            type="button"
            aria-pressed={item.done}
            aria-label={fill(T.view.taskToggle, { name })}
            onClick={() => {
              fire(actions.toggleDone(trip.id, item.id));
              announce(fill(item.done ? T.view.taskUndo : T.view.taskDone, { name }));
            }}
          >
            <Icon name="check" />
          </button>
        ) : null}
        {sort ? <MoveButtons item={item} name={name} sort={sort} /> : null}
      </div>
      {assignable && permissionsOf(trip).schedule ? <AssignRow item={item} /> : null}
      {!assignable && !sort && !isTask && permissionsOf(trip).canChange(item) ? <ItemFoot item={item} name={name} /> : null}
    </div>
  );
}
