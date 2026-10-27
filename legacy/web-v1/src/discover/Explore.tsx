import { useEffect, useState } from 'react';
import { api, errorText } from '../api';
import type { DestinationSummary } from '../api';
import { Icon } from './Icon';
import { Compass, Plane } from './illustrations';
import { monthsLabel, CATEGORY_ICON, plain } from './format';
import { PlaceSheet } from './PlaceSheet';
import { useDiscover } from './store';
import { useDestination } from './useDestination';

const SOON = ['Sa Pa', 'Hội An', 'Đà Lạt', 'Ninh Bình', 'Phú Quốc', 'Đà Nẵng'];

/** Màn Khám phá: ảnh bìa, ô tìm điểm đến, điểm đến đang mở, nơi nổi bật. */
export function Explore() {
  const [q, setQ] = useState('');
  const [all, setAll] = useState<DestinationSummary[] | null>(null);
  const [list, setList] = useState<DestinationSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const s = useDiscover();

  useEffect(() => {
    api
      .searchDestinations('')
      .then((r) => {
        setAll(r.destinations);
        setList(r.destinations);
        setError(null);
      })
      .catch((e: unknown) => setError(errorText(e)));
  }, []);

  useEffect(() => {
    if (all === null) return;
    if (q.trim() === '') {
      setList(all);
      return;
    }
    let alive = true;
    const t = window.setTimeout(() => {
      api
        .searchDestinations(q.trim())
        .then((r) => {
          if (!alive) return;
          setList(r.destinations);
          setError(null);
        })
        .catch((e: unknown) => alive && setError(errorText(e)));
    }, 200);
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, [q, all]);

  const hero = all?.[0] ?? null;
  const { data: detail } = useDestination(hero?.id ?? null);
  const picked = detail ? detail.places.filter((p) => s.decisions[p.id] === 'like') : [];
  const open = detail?.places.find((p) => p.id === openId) ?? null;
  const normalized = plain(q.trim());
  const soon = normalized === '' ? SOON : SOON.filter((x) => plain(x).includes(normalized));

  return (
    <div className="scr">
      <section className="sky">
        <div className="cloud" style={{ width: 260, height: 120, left: -60, top: 130 }} />
        <div className="cloud" style={{ width: 300, height: 130, right: -80, top: 260 }} />
        <div className="cloud" style={{ width: 220, height: 100, left: 40, top: 400 }} />
        <div className="logo">Wander</div>
        <div className="tagline">Quẹt nơi mê, đi cho đã.</div>
        <Plane />
        <div className="fan">
          {(hero?.previews ?? []).slice(0, 3).map((pv, i) => (
            <figure key={pv.placeId} className={['f1', 'f2', 'f3'][i]}>
              <img src={pv.url} alt="" />
              <i />
              <span>{pv.name}</span>
            </figure>
          ))}
        </div>
        <Compass />
      </section>
      <label className="search">
        <Icon name="compass" />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Bạn muốn đi đâu? Thử Hà Giang" autoComplete="off" aria-label="Tìm điểm đến" />
      </label>

      <div className="sections pad-x">
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
        {all === null && !error ? <p className="note">Đang tải…</p> : null}

        {q.trim() === '' && picked.length > 0 ? (
          <section className="dk-stack">
            <h2 className="h2">Đang chọn dở</h2>
            <a className="resume" href="#/picked">
              <img alt="" src={picked[0]?.photos[0]?.url} />
              <div>
                <h3>{picked.length} địa điểm đã chọn</h3>
                <p>{hero?.name}, chưa lưu thành chuyến đi</p>
              </div>
              <span className="dk-chip tint cat-canh">Xem</span>
            </a>
          </section>
        ) : null}

        {(list ?? []).map((d) => (
          <section key={d.id} className="dk-stack">
            <h2 className="h2">Khám phá ngay</h2>
            <a className="dcard" href={`#/dest/${d.id}`}>
              <img alt="" src={d.coverUrl} />
              <span className="pill cta">Xem cẩm nang</span>
              <span className="dcard-in">
                <h3>{d.name}</h3>
                <span className="row">
                  <span className="dk-chip glass">
                    <Icon name="map-pin" size="s" />
                    {d.placeCount} địa điểm
                  </span>
                  {d.bestMonths.length ? (
                    <span className="dk-chip glass">
                      <Icon name="calendar-event" size="s" />
                      Đẹp nhất {monthsLabel(d.bestMonths).toLowerCase()}
                    </span>
                  ) : null}
                </span>
              </span>
            </a>
          </section>
        ))}

        {list !== null && list.length === 0 && soon.length === 0 ? <p className="note">Chưa có điểm đến nào khớp “{q}”.</p> : null}

        {q.trim() === '' && detail ? (
          <section className="dk-stack">
            <h2 className="h2">Nổi bật ở {detail.name}</h2>
            <div className="hscroll">
              {detail.places.slice(0, 6).map((p) => (
                <button key={p.id} type="button" className={`mini cat-${p.category}`} onClick={() => setOpenId(p.id)}>
                  <img alt="" src={p.photos[0]?.url} />
                  <span className="catbadge">
                    <Icon name={CATEGORY_ICON[p.category] ?? 'map-pin'} />
                  </span>
                  <span className="in">
                    <h3>{p.name}</h3>
                    <p>{p.area}</p>
                  </span>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {soon.length > 0 ? (
          <section className="dk-stack">
            <h2 className="h2">Sắp ra mắt</h2>
            <div className="soon">
              {soon.map((x) => (
                <span key={x}>{x}</span>
              ))}
            </div>
          </section>
        ) : null}
      </div>
      {open ? <PlaceSheet place={open} onClose={() => setOpenId(null)} /> : null}
    </div>
  );
}
