import { fill } from '../../../shared/const/copy.vi.ts';
import { Icon } from '../../../shared/ui/Icon.tsx';
import { IconButton } from '../../../shared/ui/IconButton.tsx';
import { CATEGORY_ICON } from '../../discover/index.ts';
import { useTrips } from '../hooks/TripsProvider.tsx';
import { useTripView } from '../hooks/TripViewContext.tsx';
import { ITEM_KINDS } from '../model/trip.const.ts';
import type { TripItem } from '../model/trip.types.ts';
import { dayItems } from '../model/tripMath.ts';
import { itemName } from '../model/tripView.ts';
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
  const { trip, days, announce } = useTripView();
  return (
    <div className="assign">
      <span>{T.view.chooseDay}</span>
      {days.map((d, k) => (
        <button
          key={d}
          className="dchip"
          type="button"
          onClick={() => {
            actions.assignDay(trip.id, item.id, d);
            announce(fill(T.pickDay.assigned, { n: k + 1 }));
          }}
        >
          {fill(T.view.day, { n: k + 1 })}
        </button>
      ))}
    </div>
  );
}

/** Nút lên/xuống của chế độ sắp xếp (thay thế đầy đủ cho kéo thả; bàn phím và đọc màn hình dùng được). */
function MoveButtons({ item, name, sort }: { readonly item: TripItem; readonly name: string; readonly sort: { readonly first: boolean; readonly last: boolean } }) {
  const { actions } = useTrips();
  const { trip, cat, announce } = useTripView();
  const move = (dir: 'up' | 'down'): void => {
    actions.moveItem(trip.id, item.id, dir);
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
    <>
      <div className={sort ? 'swipe sorting' : 'swipe'} data-item={item.id} data-tab={tab}>
        <button className={rowCls} type="button" onClick={() => openItem(item.id)} data-day-index={dayIdx}>
          <div className={photo ? 'im' : 'im ktile'}>
            {photo ? <img alt="" src={photo} /> : <Icon name={kind.icon} size="l" />}
            {num ? <b>{num}</b> : null}
          </div>
          <div className="tx">
            <span className="kind">
              <Icon name={place ? CATEGORY_ICON[place.category] : kind.icon} size="s" />
              {place ? `${place.categoryName} · ${place.area}` : kind.label}
            </span>
            <h3>{name}</h3>
            {snippet ? <p className="snip">{snippet}</p> : null}
            <ItemMeta item={item} />
          </div>
        </button>
        {isTask ? (
          <button
            className="taskchk"
            type="button"
            aria-pressed={item.done}
            aria-label={fill(T.view.taskToggle, { name })}
            onClick={() => {
              actions.toggleDone(trip.id, item.id);
              announce(fill(item.done ? T.view.taskUndo : T.view.taskDone, { name }));
            }}
          >
            <Icon name="check" />
          </button>
        ) : null}
        {sort ? <MoveButtons item={item} name={name} sort={sort} /> : null}
      </div>
      {assignable ? <AssignRow item={item} /> : null}
    </>
  );
}
