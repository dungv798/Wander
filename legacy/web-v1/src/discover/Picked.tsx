import { useState } from 'react';
import { Icon } from './Icon';
import { CATEGORY_ICON } from './format';
import { PlaceSheet } from './PlaceSheet';
import { discover, useDiscover } from './store';
import { useDestination } from './useDestination';

/** Các địa điểm đã quẹt phải, chưa lưu thành chuyến đi. Lưu thành chuyến đi cần "mục chưa có ngày" (DR-006), chưa làm. */
export function Picked({ destinationId }: { destinationId: string }) {
  const { data, error } = useDestination(destinationId);
  const s = useDiscover();
  const [openId, setOpenId] = useState<string | null>(null);
  const picks = (data?.places ?? []).filter((p) => s.decisions[p.id] === 'like');
  const open = picks.find((p) => p.id === openId) ?? null;

  return (
    <div className="scr">
      <div className="pagehead pad-x">
        <p className="note">{data?.name ?? ''}</p>
        <h1>Địa điểm đã chọn</h1>
        <p className="note">Những nơi bạn đã quẹt phải, chưa lưu vào chuyến đi.</p>
      </div>
      {error ? (
        <p className="error pad-x" role="alert">
          {error}
        </p>
      ) : null}
      {data && picks.length === 0 ? (
        <div className="empty pad-x">
          <h2 className="h2">Chưa chọn nơi nào</h2>
          <p>Quẹt phải những nơi bạn muốn đến, chúng sẽ nằm ở đây.</p>
          <a className="btn" href={`#/dest/${data.id}/swipe`}>
            Bắt đầu khám phá
          </a>
        </div>
      ) : null}
      {picks.length > 0 ? (
        <>
          <div className="grid pad-x">
            {picks.map((p) => (
              <div key={p.id} className={`tile cat-${p.category}`}>
                <button type="button" className="tilebtn" aria-label={`Xem ${p.name}`} onClick={() => setOpenId(p.id)}>
                  <img alt="" src={p.photos[0]?.url} />
                  <span className="in">
                    <h3>{p.name}</h3>
                    <p>{p.area}</p>
                  </span>
                </button>
                <span className="catbadge">
                  <Icon name={CATEGORY_ICON[p.category] ?? 'map-pin'} />
                </span>
                <button type="button" className="x" aria-label={`Bỏ chọn ${p.name}`} onClick={() => discover.unpick(p.id)}>
                  <Icon name="x" size="s" />
                </button>
              </div>
            ))}
          </div>
          <div className="stickybar pad-x">
            <button type="button" className="btn block" disabled>
              <Icon name="calendar-event" />
              Lưu {picks.length} địa điểm thành chuyến đi (sắp có)
            </button>
            <p className="note" style={{ marginTop: 8, textAlign: 'center' }}>
              Lựa chọn của bạn đang lưu trong trình duyệt này. Bước lưu thành chuyến đi đang được làm.
            </p>
          </div>
        </>
      ) : null}
      {open ? <PlaceSheet place={open} onClose={() => setOpenId(null)} /> : null}
    </div>
  );
}
