import type { DestinationDetail, GuideSectionView } from '../api';
import { CATEGORY_ICON } from './format';
import { Icon } from './Icon';
import { discover, useDiscover } from './store';

/** Cẩm nang điểm đến: mỗi khối một kiểu hiển thị (tháng, danh sách đánh dấu, thẻ, địa điểm, dòng). Nội dung là bản nháp biên tập. */
export function Guide({ dest, onOpenPlace }: { dest: DestinationDetail; onOpenPlace: (placeId: string) => void }) {
  const s = useDiscover();
  return (
    <>
      <div className="guide">
        {dest.guide.map((g) => {
          const open = s.guide === g.id;
          return (
            <div key={g.id} className={`gblock cat-${g.category}${open ? ' open' : ''}`}>
              <button type="button" className="ghead" aria-expanded={open} aria-controls={`g-${g.id}`} onClick={() => discover.toggleGuide(g.id)}>
                <span className="ib">
                  <Icon name={g.icon || CATEGORY_ICON[g.category] || 'info-circle'} />
                </span>
                <span>
                  <b>{g.title}</b>
                  <span className="sum">{g.summary}</span>
                </span>
                <span className="chev">
                  <Icon name="chevron-down" />
                </span>
              </button>
              <div className="gbody" id={`g-${g.id}`}>
                {open ? <Body g={g} onOpenPlace={onOpenPlace} pack={s.pack} /> : null}
              </div>
            </div>
          );
        })}
      </div>
      <p className="gfoot">Wander biên soạn, bản nháp. Hãy kiểm tra lại trước khi đi.</p>
    </>
  );
}

function Body({ g, onOpenPlace, pack }: { g: GuideSectionView; onOpenPlace: (id: string) => void; pack: Record<string, boolean> }) {
  switch (g.layout) {
    case 'months':
      return (
        <>
          <div className="months" role="img" aria-label={`Đẹp nhất: tháng ${g.bestMonths.join(', ')}. Mưa nhiều: tháng ${g.rainyMonths.join(', ')}`}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <i key={m} className={g.bestMonths.includes(m) ? 'best' : g.rainyMonths.includes(m) ? 'rain' : ''}>
                {m}
              </i>
            ))}
          </div>
          <div className="leg">
            <span>Đẹp nhất (ô xanh lá)</span>
            <span className="r">Mưa nhiều (ô xanh dương)</span>
          </div>
          {g.notes.map((n) => (
            <p key={n} className="note">
              {n}
            </p>
          ))}
        </>
      );
    case 'checklist':
      return (
        <>
          <div className="packs">
            {g.items.map((it) => (
              <button key={it.title} type="button" className="pack" aria-pressed={!!pack[it.title]} onClick={() => discover.togglePack(it.title)}>
                <Icon name="check" size="s" />
                {it.title}
              </button>
            ))}
          </div>
          <p className="note">Bấm để đánh dấu đã chuẩn bị.</p>
        </>
      );
    case 'cards':
      return (
        <div className="foods">
          {g.items.map((it) => (
            <div key={it.title} className="food">
              <Icon name={it.icon || 'tools-kitchen-2'} size="l" />
              <b>{it.title}</b>
              <p>{it.text}</p>
            </div>
          ))}
        </div>
      );
    case 'places':
      return (
        <>
          {g.items.map((it) => (
            <button key={it.title} type="button" className="grow" onClick={() => it.placeId && onOpenPlace(it.placeId)}>
              <span className={`catbadge cat-${g.category}`}>
                <Icon name={CATEGORY_ICON[g.category] ?? 'trees'} />
              </span>
              <span>
                <b>{it.title}</b>
                <span className="d">{it.text}</span>
              </span>
              <Icon name="chevron-down" size="s" />
            </button>
          ))}
        </>
      );
    default:
      return (
        <>
          {g.items.map((it) => (
            <div key={it.title} className="grow">
              <span className="ib">
                <Icon name={it.icon || 'info-circle'} />
              </span>
              <span>
                <b>{it.title}</b>
                <span className="d">{it.text}</span>
              </span>
              <span />
            </div>
          ))}
        </>
      );
  }
}
