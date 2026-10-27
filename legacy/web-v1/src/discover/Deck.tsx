import { useCallback, useEffect, useRef, useState } from 'react';
import type { PlaceView } from '../api';
import { CATEGORY_ICON } from './format';
import { Icon } from './Icon';
import { PlaceSheet } from './PlaceSheet';
import { discover, useDiscover } from './store';
import { useDestination } from './useDestination';

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Bay thẻ ra khỏi màn hình rồi gọi done (không hoạt ảnh nếu người dùng tắt chuyển động). */
function fling(card: HTMLElement, dir: 'like' | 'skip', done: () => void): void {
  if (card.dataset['gone']) return;
  card.dataset['gone'] = '1';
  if (reduced()) {
    done();
    return;
  }
  const sg = dir === 'like' ? 1 : -1;
  card.style.transition = 'transform .32s ease-out, opacity .32s';
  card.style.transform = `translate(${sg * 560}px,-30px) rotate(${sg * 28}deg)`;
  card.style.opacity = '0';
  window.setTimeout(done, 300);
}

interface CardProps {
  place: PlaceView;
  depth: number;
  photo: number;
  onDecide: (dir: 'like' | 'skip') => void;
  onInfo: () => void;
  onPhoto: (index: number) => void;
}

function SwipeCard({ place: p, depth, photo, onDecide, onInfo, onPhoto }: CardProps) {
  const ref = useRef<HTMLElement>(null);
  const drag = useRef({ down: false, moved: false, sx: 0, sy: 0, dx: 0, t0: 0 });
  const [credit, setCredit] = useState(false);
  const front = depth === 0;
  const n = p.photos.length;
  const away = p.away[0];
  const ph = p.photos[Math.min(photo, n - 1)] ?? p.photos[0];

  useEffect(() => setCredit(false), [photo, p.id]);

  const stamps = (dx: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.querySelector<HTMLElement>('.stamp.r');
    const l = el.querySelector<HTMLElement>('.stamp.l');
    if (r) r.style.opacity = String(Math.max(0, Math.min(1, dx / 90)));
    if (l) l.style.opacity = String(Math.max(0, Math.min(1, -dx / 90)));
  };

  const down = (e: React.PointerEvent<HTMLElement>) => {
    if (!front || (e.target as HTMLElement).closest('.more, .credit-btn, .credit-pill')) return;
    const d = drag.current;
    d.down = true;
    d.moved = false;
    d.sx = e.clientX;
    d.sy = e.clientY;
    d.dx = 0;
    d.t0 = performance.now();
    const el = ref.current;
    if (el) {
      el.style.transition = 'none';
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* bỏ qua */
      }
    }
  };
  const move = (e: React.PointerEvent<HTMLElement>) => {
    const d = drag.current;
    const el = ref.current;
    if (!d.down || !el) return;
    d.dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    if (Math.abs(d.dx) + Math.abs(dy) > 8) d.moved = true;
    el.style.transform = `translate(${d.dx}px,${dy * 0.3}px) rotate(${d.dx / 18}deg)`;
    stamps(d.dx);
  };
  const up = (e: React.PointerEvent<HTMLElement>) => {
    const d = drag.current;
    const el = ref.current;
    if (!d.down || !el) return;
    d.down = false;
    const v = d.dx / Math.max(1, performance.now() - d.t0);
    if (Math.abs(d.dx) > 110 || (Math.abs(v) > 0.6 && Math.abs(d.dx) > 40)) {
      const dir = d.dx > 0 ? 'like' : 'skip';
      fling(el, dir, () => onDecide(dir));
      return;
    }
    el.style.transition = 'transform .28s cubic-bezier(.2,.8,.2,1)';
    el.style.transform = '';
    stamps(0);
    if (!d.moved && e.type === 'pointerup') {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      if (n > 1 && x < 0.3) onPhoto(Math.max(0, photo - 1));
      else if (n > 1 && x > 0.7) onPhoto(Math.min(n - 1, photo + 1));
      else onInfo();
    }
  };

  return (
    <article
      ref={ref}
      className={`dk-card cat-${p.category} ${front ? 'front' : `depth-${depth}`}`}
      data-place={p.id}
      aria-label={front ? `${p.name}. Quẹt phải để chọn, quẹt trái để bỏ qua. Chạm cạnh trái hoặc phải để đổi ảnh.` : undefined}
      aria-hidden={front ? undefined : true}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
    >
      <img className="ph" alt="" src={ph?.url} draggable={false} />
      {n > 1 ? (
        <div className="segs" aria-hidden="true">
          {p.photos.map((x, k) => (
            <i key={x.url} className={k <= photo ? 'on' : ''} />
          ))}
        </div>
      ) : null}
      {front ? (
        <button type="button" className="credit-btn" aria-label="Nguồn ảnh" aria-expanded={credit} onClick={() => setCredit((v) => !v)}>
          <Icon name="info-circle" />
        </button>
      ) : null}
      {credit && ph ? (
        <div className="credit-pill">
          Ảnh: {ph.author} · {ph.license} ·{' '}
          <a href={ph.sourceUrl} target="_blank" rel="noopener noreferrer">
            Xem ảnh gốc
          </a>
        </div>
      ) : null}
      <span className="stamp r">THÍCH</span>
      <span className="stamp l">BỎ QUA</span>
      <div className="scrim">
        <div className="tags">
          <span className="dk-chip cat">
            <Icon name={CATEGORY_ICON[p.category] ?? 'map-pin'} size="s" />
            {p.categoryName}
          </span>
          <span className="dk-chip glass">
            <Icon name="calendar-event" size="s" />
            {p.bestLabel}
          </span>
          <span className="dk-chip glass">
            <Icon name="clock" size="s" />
            {p.duration}
          </span>
        </div>
        <h2>{p.name}</h2>
        {away ? (
          <div className="away">
            <Icon name="route" size="s" />
            Cách {away.refName} ~{away.km} km · ước tính
          </div>
        ) : null}
        <p className="hook">{p.hook}</p>
        {front ? (
          <button type="button" className="more" onClick={onInfo}>
            <Icon name="chevron-up" size="s" />
            Xem chi tiết
          </button>
        ) : null}
      </div>
    </article>
  );
}

/** Bộ thẻ quẹt của một điểm đến: quẹt phải = chọn, quẹt trái = bỏ qua, hoàn tác, lọc theo loại, mở chi tiết. */
export function Deck({ id }: { id: string }) {
  const { data, error } = useDestination(id);
  const s = useDiscover();
  const [info, setInfo] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const area = useRef<HTMLDivElement>(null);
  useEffect(() => discover.visit(id), [id]);

  const places = data?.places ?? [];
  const cats = [...new Set(places.map((p) => p.category))];
  const left = places.filter((p) => !s.decisions[p.id] && (s.cat === 'all' || p.category === s.cat));
  const seen = places.filter((p) => s.decisions[p.id]).length;
  const picked = places.filter((p) => s.decisions[p.id] === 'like').length;
  const open = places.find((p) => p.id === info) ?? null;

  /** Ghi quyết định và thông báo cho trình đọc màn hình (vùng aria-live). */
  const decide = useCallback((p: PlaceView, dir: 'like' | 'skip') => {
    discover.decide(p.id, dir);
    setNote(`${dir === 'like' ? 'Đã chọn' : 'Đã bỏ qua'} ${p.name}`);
  }, []);
  /** Hoàn tác; nếu thẻ hồi lại đang bị bộ lọc loại ẩn thì bỏ lọc để người dùng thấy nó. */
  const undo = useCallback(() => {
    const id = discover.undo();
    const p = places.find((x) => x.id === id);
    if (p) {
      if (s.cat !== 'all' && p.category !== s.cat) discover.setCat('all');
      setNote(`Đã hoàn tác ${p.name}`);
    }
  }, [places, s.cat]);
  const swipe = useCallback(
    (dir: 'like' | 'skip') => {
      const card = area.current?.querySelector<HTMLElement>('.dk-card.front');
      const place = places.find((x) => x.id === card?.dataset['place']);
      if (card && place) fling(card, dir, () => decide(place, dir));
    },
    [places, decide],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (info || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'ArrowRight') swipe('like');
      else if (e.key === 'ArrowLeft') swipe('skip');
      else if (e.key === 'ArrowUp') setInfo(area.current?.querySelector<HTMLElement>('.dk-card.front')?.dataset['place'] ?? null);
      else if (e.key === 'z') undo();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [info, swipe, undo]);

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

  return (
    <div className="immersive">
      <div className="deckbar pad-x">
        <a className="iconbtn" href={`#/dest/${data.id}`} aria-label="Quay lại" style={{ background: 'var(--surface)' }}>
          <Icon name="chevron-left" />
        </a>
        <div className="mid">
          <h1>{data.name}</h1>
          <p className="note">
            Đã xem {seen}/{places.length}
          </p>
        </div>
        <a className="pill" href="#/picked">
          <Icon name="check" size="s" />
          Xem đã chọn ({picked})
        </a>
      </div>
      <div className="filters pad-x" role="group" aria-label="Lọc theo loại">
        <button type="button" className="fchip" aria-pressed={s.cat === 'all'} onClick={() => discover.setCat('all')}>
          Tất cả
        </button>
        {cats.map((c) => (
          <button key={c} type="button" className={`fchip cat-${c}`} aria-pressed={s.cat === c} onClick={() => discover.setCat(c)}>
            <Icon name={CATEGORY_ICON[c] ?? 'map-pin'} size="s" />
            {places.find((p) => p.category === c)?.categoryName}
          </button>
        ))}
      </div>
      {left.length === 0 ? (
        <div className="empty pad-x">
          <h2 className="h2">Hết thẻ rồi</h2>
          <p>{s.cat !== 'all' ? 'Hết thẻ ở loại này. Thử chọn loại khác.' : `Bạn đã chọn ${picked} địa điểm ở ${data.name}.`}</p>
          <a className="btn" href="#/picked">
            Xem đã chọn
          </a>
          <button type="button" className="btn ghost" onClick={undo} disabled={s.history.length === 0}>
            Hoàn tác thẻ cuối
          </button>
          <button type="button" className="btn ghost" onClick={() => discover.restoreSkipped()}>
            Xem lại các thẻ đã bỏ qua
          </button>
        </div>
      ) : (
        <div className="deckwrap pad-x" ref={area}>
          <div className="deck">
            {left
              .slice(0, 3)
              .map((p, i) => ({ p, i }))
              .reverse()
              .map(({ p, i }) => (
                <SwipeCard
                  key={p.id}
                  place={p}
                  depth={i}
                  photo={s.photo[p.id] ?? 0}
                  onDecide={(dir) => decide(p, dir)}
                  onInfo={() => setInfo(p.id)}
                  onPhoto={(k) => discover.setPhoto(p.id, k)}
                />
              ))}
          </div>
          <div className="dk-actions">
            <div className="act">
              <button type="button" className="round small" aria-label="Hoàn tác" disabled={s.history.length === 0} onClick={undo}>
                <Icon name="arrow-back-up" />
              </button>
              Hoàn tác
            </div>
            <div className="act">
              <button type="button" className="round l" aria-label="Bỏ qua" onClick={() => swipe('skip')}>
                <Icon name="x" />
              </button>
              Bỏ qua
            </div>
            <div className="act">
              <button type="button" className="round r" aria-label="Chọn nơi này" onClick={() => swipe('like')}>
                <Icon name="check" />
              </button>
              Chọn
            </div>
            <div className="act">
              <button
                type="button"
                className="round small"
                aria-label="Xem chi tiết"
                onClick={() => setInfo(area.current?.querySelector<HTMLElement>('.dk-card.front')?.dataset['place'] ?? null)}
              >
                <Icon name="chevron-up" />
              </button>
              Chi tiết
            </div>
          </div>
        </div>
      )}
      <p className="sr" role="status" aria-live="polite">
        {note}
      </p>
      {open ? (
        <PlaceSheet
          place={open}
          actions={
            s.decisions[open.id]
              ? null
              : {
                  skip: () => {
                    decide(open, 'skip');
                    setInfo(null);
                  },
                  pick: () => {
                    decide(open, 'like');
                    setInfo(null);
                  },
                }
          }
          onClose={() => setInfo(null)}
        />
      ) : null}
    </div>
  );
}
