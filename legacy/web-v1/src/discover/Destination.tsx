import { useEffect, useState } from 'react';
import { Guide } from './Guide';
import { Icon } from './Icon';
import { monthsLabel } from './format';
import { PlaceSheet } from './PlaceSheet';
import { discover } from './store';
import { useDestination } from './useDestination';

/** Trang điểm đến: ảnh bìa, nút bắt đầu quẹt, cẩm nang. */
export function Destination({ id }: { id: string }) {
  const { data, error } = useDestination(id);
  const [openId, setOpenId] = useState<string | null>(null);
  useEffect(() => discover.visit(id), [id]);

  if (error) {
    return (
      <div className="pad-x" style={{ paddingTop: 24 }}>
        <p className="error" role="alert">
          {error}
        </p>
        <a className="btn ghost" href="#/">
          Về Khám phá
        </a>
      </div>
    );
  }
  if (!data) return <p className="note pad-x" style={{ paddingTop: 24 }}>Đang tải…</p>;
  const months = data.guide.find((g) => g.layout === 'months')?.bestMonths ?? [];
  const open = data.places.find((p) => p.id === openId) ?? null;

  return (
    <div className="scr">
      <section className="dhero">
        <img alt="" src={data.coverUrl} />
        <div className="top">
          <a className="iconbtn" href="#/" aria-label="Quay lại">
            <Icon name="chevron-left" />
          </a>
        </div>
        <div className="in">
          <h1>{data.name}</h1>
          <div className="row">
            <span className="dk-chip glass">
              <Icon name="map-pin" size="s" />
              {data.places.length} địa điểm
            </span>
            {months.length ? (
              <span className="dk-chip glass">
                <Icon name="calendar-event" size="s" />
                Đẹp nhất {monthsLabel(months).toLowerCase()}
              </span>
            ) : null}
          </div>
        </div>
      </section>
      <div className="dbody pad-x">
        <div className="two">
          <a className="btn" href={`#/dest/${data.id}/swipe`}>
            <Icon name="hand-finger" />
            Bắt đầu quẹt
          </a>
          <a className="btn ghost" href="#/trips">
            <Icon name="calendar-event" />
            Chuyến đi
          </a>
        </div>
        <h2 className="h2">Cẩm nang {data.name}</h2>
        <Guide dest={data} onOpenPlace={setOpenId} />
      </div>
      {open ? <PlaceSheet place={open} onClose={() => setOpenId(null)} /> : null}
    </div>
  );
}
