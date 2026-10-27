import { useCallback, useEffect, useRef, useState } from 'react';
import type { PlaceView } from '../api';
import { CATEGORY_ICON, formatTravel, SLOTS, VERDICT_ICON } from './format';
import { Icon } from './Icon';

interface Props {
  place: PlaceView;
  /** Nút hành động cố định ở đáy (ví dụ Bỏ qua / Chọn nơi này). Không truyền thì không hiện thanh. */
  actions?: { skip: () => void; pick: () => void } | null;
  onClose: () => void;
}

/** Trang chi tiết địa điểm: ảnh nhiều tấm, cách trung tâm bao xa, có gì, gợi ý của Wander, buổi nên đi, mùa đẹp, mẹo. */
export function PlaceSheet({ place: p, actions, onClose }: Props) {
  const gallery = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [credit, setCredit] = useState(false);
  const [more, setMore] = useState(false);
  const n = p.photos.length;
  const away = p.away[0];
  const second = p.away.find((a) => a.refId !== away?.refId);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; // khóa cuộn nền khi hộp thoại mở
    closeBtn.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      opener?.focus?.();
    };
  }, []);

  const go = useCallback((delta: number) => {
    const g = gallery.current;
    if (!g) return;
    const i = Math.max(0, Math.min(g.children.length - 1, Math.round(g.scrollLeft / Math.max(1, g.clientWidth)) + delta));
    g.scrollTo({ left: i * g.clientWidth, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'Tab' && panel.current) {
        // bẫy Tab trong hộp thoại (aria-modal)
        const items = [...panel.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), summary, [tabindex="0"]')].filter((el) => el.offsetParent !== null);
        const first = items[0];
        const last = items[items.length - 1];
        if (first && last) {
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      } else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, onClose]);

  const photo = p.photos[index] ?? p.photos[0];

  return (
    <div
      className="sheet"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="panel" ref={panel} role="dialog" aria-modal="true" aria-label={p.name}>
        <div className={`gal cat-${p.category}`}>
          <div
            className="gallery"
            ref={gallery}
            tabIndex={0}
            aria-label={`Ảnh của ${p.name}`}
            onScroll={(e) => {
              const g = e.currentTarget;
              setIndex(Math.round(g.scrollLeft / Math.max(1, g.clientWidth)));
              setCredit(false);
            }}
          >
            {p.photos.map((ph) => (
              <img key={ph.url} src={ph.url} alt={p.name} loading="lazy" />
            ))}
          </div>
          {n > 1 ? (
            <>
              <button type="button" className="gnav prev" aria-label="Ảnh trước" disabled={index === 0} onClick={() => go(-1)}>
                <Icon name="chevron-left" size="l" />
              </button>
              <button type="button" className="gnav next" aria-label="Ảnh sau" disabled={index === n - 1} onClick={() => go(1)}>
                <span style={{ transform: 'rotate(180deg)', display: 'grid' }}>
                  <Icon name="chevron-left" size="l" />
                </span>
              </button>
              <span className="gcount" aria-live="polite">
                {index + 1} / {n}
              </span>
              <div className="dots" aria-hidden="true">
                {p.photos.map((ph, k) => (
                  <i key={ph.url} className={k === index ? 'on' : ''} />
                ))}
              </div>
            </>
          ) : null}
          <button ref={closeBtn} type="button" className="iconbtn close" aria-label="Đóng" onClick={onClose}>
            <Icon name="x" />
          </button>
          <span className="dk-chip cat">
            <Icon name={CATEGORY_ICON[p.category] ?? 'map-pin'} size="s" />
            {p.categoryName}
          </span>
          <button type="button" className="credit-btn" aria-label="Nguồn ảnh" aria-expanded={credit} onClick={() => setCredit((v) => !v)}>
            <Icon name="info-circle" />
          </button>
          {credit && photo ? (
            <div className="credit-pill">
              Ảnh: {photo.author} · {photo.license} ·{' '}
              <a href={photo.sourceUrl} target="_blank" rel="noopener noreferrer">
                Xem ảnh gốc
              </a>
            </div>
          ) : null}
        </div>

        <div className={`pp cat-${p.category}`}>
          <div className="dk-stack" style={{ gap: 8 }}>
            <h2>{p.name}</h2>
            <p className="note" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="map-pin" size="s" />
              {p.area}
            </p>
            <p className="lead">{p.hook}</p>
          </div>

          <div className="tiles3">
            <div className="tl">
              <Icon name="route" />
              <b>{away ? `~${away.km} km` : '—'}</b>
              <span>
                Cách {away ? away.refName : 'trung tâm'}, ước tính
                {second && second.km < (away?.km ?? 0) * 0.6 ? <><br />(~{second.km} km từ {second.refName})</> : null}
              </span>
            </div>
            <div className="tl">
              <Icon name="motorbike" />
              <b>{away ? formatTravel(away.minutes) : '—'}</b>
              <span>Đi xe máy, ước tính</span>
            </div>
            <div className="tl">
              <Icon name="clock" />
              <b>{p.duration}</b>
              <span>Thời gian tham quan</span>
            </div>
          </div>
          <p className="note" style={{ marginTop: -12 }}>
            Khoảng cách tính theo đường chim bay nhân hệ số đường núi, chỉ để tham khảo. Đường thực tế có thể lâu hơn.
          </p>

          <div>
            <h4>
              <Icon name="sparkles" />
              Có gì ở đây
            </h4>
            <div className="dk-chips">
              {p.highlights.map((h) => (
                <span key={h} className="dk-chip tint">
                  <Icon name="check" size="s" />
                  {h}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4>
              <Icon name="rosette-discount-check" />
              Wander gợi ý
            </h4>
            <div className={`rate ${p.verdict === 'worth' ? 'mid' : p.verdict === 'ifconv' ? 'low' : ''}`}>
              <span className="ib">
                <Icon name={VERDICT_ICON[p.verdict] ?? 'heart'} size="l" />
              </span>
              <span>
                <b>{p.verdictLabel}</b>
                <span>{p.verdictReason}</span>
                <small>Ý kiến biên tập của Wander, bản nháp.</small>
              </span>
            </div>
          </div>

          <div>
            <h4>
              <Icon name="sun" />
              Nên đi buổi nào
            </h4>
            <div className="tod">
              {SLOTS.map((s) => {
                const on = p.bestSlots.includes(s.code);
                return (
                  <div key={s.code} className={on ? 'on' : ''}>
                    <Icon name={s.icon} size="l" />
                    {s.label}
                    {on ? <small>Nên đi</small> : null}
                  </div>
                );
              })}
            </div>
            <p className="note" style={{ marginTop: 8 }}>
              {p.slotReason}
            </p>
          </div>

          <div>
            <h4>
              <Icon name="calendar-event" />
              Mùa đẹp và độ khó
            </h4>
            <div className="months" role="img" aria-label={`Tháng đẹp: ${p.bestLabel}`}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <i key={m} className={p.bestMonths.includes(m) ? 'best' : ''}>
                  {m}
                </i>
              ))}
            </div>
            <p className="note" style={{ marginTop: 8 }}>
              Tháng đẹp: {p.bestLabel} · Độ khó: <b>{p.difficulty}</b>
            </p>
          </div>

          {p.tips.length > 0 ? (
            <div className="tipbox">
              <h4 style={{ margin: 0 }}>
                <Icon name="bulb" />
                Mẹo
              </h4>
              {p.tips.map((t) => (
                <p key={t}>
                  <Icon name="check" size="s" />
                  {t}
                </p>
              ))}
            </div>
          ) : null}

          <div>
            <h4>
              <Icon name="info-circle" />
              Về nơi này
            </h4>
            <p className={`body${more ? '' : ' clamp'}`}>{p.summary || 'Chưa có mô tả.'}</p>
            {p.summary.length > 220 ? (
              <button type="button" className="linkbtn" onClick={() => setMore((v) => !v)}>
                {more ? 'Thu gọn' : 'Xem thêm'}
              </button>
            ) : null}
          </div>

          {p.lat != null && p.lon != null ? (
            <p className="body">
              <a href={`https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lon}#map=13/${p.lat}/${p.lon}`} target="_blank" rel="noopener noreferrer">
                Mở vị trí trên OpenStreetMap
              </a>
            </p>
          ) : null}

          <details>
            <summary>Về dữ liệu</summary>
            <div className="credits" style={{ marginTop: 8 }}>
              <span>
                Ảnh lấy từ Wikimedia Commons theo giấy phép Creative Commons. Chạm biểu tượng ⓘ trên ảnh để xem tác giả. Mô tả lấy từ Wikipedia tiếng Việt
                (CC BY-SA 4.0). Khoảng cách và thời gian đi là ước tính. Nhãn gợi ý, mùa đẹp, buổi nên đi và mẹo là bản nháp biên tập của Wander. Biểu
                tượng: Tabler Icons (MIT).
              </span>
              {p.photos.map((ph, k) => (
                <span key={ph.url}>
                  Ảnh {k + 1}: {ph.author} · {ph.license} ·{' '}
                  <a href={ph.sourceUrl} target="_blank" rel="noopener noreferrer">
                    Wikimedia Commons
                  </a>
                </span>
              ))}
              <span>
                <a href={`https://vi.wikipedia.org/wiki/${encodeURIComponent(p.wikipediaTitle.replace(/ /g, '_'))}`} target="_blank" rel="noopener noreferrer">
                  Bài Wikipedia: {p.wikipediaTitle}
                </a>
              </span>
            </div>
          </details>
        </div>

        {actions ? (
          <div className="cta-bar">
            <button type="button" className="btn ghost" onClick={actions.skip}>
              <Icon name="x" />
              Bỏ qua
            </button>
            <button type="button" className="btn" onClick={actions.pick}>
              <Icon name="check" />
              Chọn nơi này
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
