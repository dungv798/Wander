import { useId, useState } from 'react';
import { COPY, fill } from '../../../../shared/const/copy.vi.ts';
import { UI } from '../../../../shared/const/app.const.ts';
import { Icon } from '../../../../shared/ui/Icon.tsx';
import { Chip } from '../../../../shared/ui/Chip.tsx';
import { DISCOVER_COPY } from '../../model/discover.copy.ts';
import { SLOTS, VERDICT_STYLE } from '../../model/discover.const.ts';
import type { PlaceView } from '../../model/Catalog.types.ts';
import { placeFacts } from '../../model/placeFacts.ts';
import { PlaceDisclosure, PlaceMoreButton } from './PlaceDisclosure.tsx';
import { safeHttpUrl } from '../../../../shared/lib/safeUrl.ts';

/** Khối nhãn biên tập "Wander gợi ý" (thay điểm sao; KHÔNG phải đánh giá người dùng, DR-007). */
export function EditorialRate({ place }: { readonly place: PlaceView }) {
  const v = VERDICT_STYLE[place.verdict];
  return (
    <div className={`rate ${v.cls}`.trim()}>
      <span className="ib">
        <Icon semantic name={v.icon} size="l" />
      </span>
      <span>
        <b>{place.verdictLabel}</b>
        <span>{place.verdictReason}</span>
        <small>{COPY.place.editorialNote}</small>
      </span>
    </div>
  );
}

/** Các hàng icon và chữ gọn; giờ và mùa đã có khối riêng nên không lặp trong lưới. */
export function QuickFacts({ place }: { readonly place: PlaceView }) {
  const facts = placeFacts(place);
  return (
    <ul className="place-facts">
      {facts.map((f) => (
        <li key={f.icon}>
          <span className="ib">
            <Icon semantic name={f.icon} />
          </span>
          <span><small>{f.label}</small><b>{f.value}</b></span>
        </li>
      ))}
    </ul>
  );
}

/** Các điểm nổi bật dạng nhãn. */
export function Highlights({ place }: { readonly place: PlaceView }) {
  if (!place.highlights.length) return null;
  return (
    <div className="place-info-card">
      <h4>
        <Icon name="sparkles" />
        {COPY.place.whatsHere}
      </h4>
      <div className="chips">
        {place.highlights.map((h) => (
          <Chip key={h} tone="tint" icon="check">{h}</Chip>
        ))}
      </div>
    </div>
  );
}

/** Bốn buổi trong ngày: buổi nên đi được tô và ghi "Nên đi", kèm lý do. */
export function TimeOfDay({ place }: { readonly place: PlaceView }) {
  return (
    <PlaceDisclosure title={COPY.place.whenToGo} icon="sun" defaultOpen>
      <div className="tod">
        {SLOTS.map((s) => {
          const on = place.bestSlots.includes(s.code);
          return (
            <div key={s.code} className={on ? 'on' : undefined}>
              <Icon semantic name={s.icon} size="l" />
              {COPY.slots[s.code]}
              {on ? <small>{COPY.place.shouldGo}</small> : null}
            </div>
          );
        })}
      </div>
      <p className="note spaced">{place.slotReason}</p>
    </PlaceDisclosure>
  );
}

/** Mười hai tháng, tháng đẹp được tô. */
export function SeasonMonths({ place }: { readonly place: PlaceView }) {
  const months = Array.from({ length: UI.MONTHS_IN_YEAR }, (_, i) => i + 1);
  return (
    <PlaceDisclosure title={COPY.place.bestSeason} icon="calendar-event">
      <div className="months">
        {months.map((m) => (
          <i key={m} className={place.bestMonths.includes(m) ? 'best' : undefined}>
            {m}
          </i>
        ))}
      </div>
    </PlaceDisclosure>
  );
}

/** Mẹo của Wander (bản nháp biên tập). */
export function Tips({ place }: { readonly place: PlaceView }) {
  return (
    <PlaceDisclosure title={COPY.place.tips} icon="bulb" className="tipbox">
      {place.tips.map((t) => (
        <p key={t}>
          <Icon name="check" size="s" />
          {t}
        </p>
      ))}
    </PlaceDisclosure>
  );
}

/** Đoạn "Về nơi này" thu gọn ba dòng, bấm "Xem thêm" để mở hết (mô tả Wikipedia, CC BY-SA). */
export function About({ place }: { readonly place: PlaceView }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="place-info-card">
      <h4>
        <Icon name="info-circle" />
        {COPY.place.about}
      </h4>
      <div className="place-about" data-open={open || !place.summary} id={id}><div><p className="body">{place.summary || COPY.place.noSummary}</p></div></div>
      {place.summary ? <PlaceMoreButton open={open} controls={id} onClick={() => setOpen(value => !value)} /> : null}
    </div>
  );
}

/** Ghi công dữ liệu và ảnh (bắt buộc theo giấy phép): tác giả, giấy phép, liên kết gốc, bài Wikipedia. */
export function DataCredits({ place }: { readonly place: PlaceView }) {
  return (
    <PlaceDisclosure title={COPY.place.dataTitle} icon="info-circle">
      <div className="credits spaced">
        <span>{COPY.place.dataNote}</span>
        {place.photos.map((p, k) => (
          <span key={p.url}>
            {fill(COPY.place.photoN, { n: k + 1, author: p.author || COPY.place.unknownAuthor, license: p.license })}
            {' · '}
            <a href={safeHttpUrl(p.sourceUrl)} target="_blank" rel="noopener noreferrer">
              {COPY.place.sourceLink}
            </a>
          </span>
        ))}
        {place.wikipediaTitle ? (
          <span>
            <a href={`https://vi.wikipedia.org/wiki/${encodeURIComponent(place.wikipediaTitle.replace(/ /g, '_'))}`} target="_blank" rel="noopener noreferrer">
              {fill(COPY.place.wikiLink, { title: place.wikipediaTitle })}
            </a>
          </span>
        ) : null}
      </div>
    </PlaceDisclosure>
  );
}

/** Liên kết mở vị trí trên OpenStreetMap (chỉ khi địa điểm có tọa độ). */
export function OsmLink({ place }: { readonly place: PlaceView }) {
  if (place.lat == null || place.lon == null) return null;
  const href = `https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lon}#map=13/${place.lat}/${place.lon}`;
  return (
      <a className="btn ghost glass-control" href={href} target="_blank" rel="noopener noreferrer" aria-label={COPY.place.openOsm}>
        <Icon name="map-pin" size="s" />{DISCOVER_COPY.map}
      </a>
  );
}
