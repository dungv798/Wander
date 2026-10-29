import { useState } from 'react';
import { COPY, fill } from '../../../../shared/const/copy.vi.ts';
import { UI } from '../../../../shared/const/app.const.ts';
import { formatTravelTime } from '../../../../shared/lib/geo.ts';
import { Icon } from '../../../../shared/ui/Icon.tsx';
import { SLOTS, VERDICT_STYLE } from '../../model/discover.const.ts';
import type { PlaceView } from '../../model/Catalog.types.ts';
import { mainAway } from '../../model/destinationQueries.ts';

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

/** Lưới 6 thông tin nhanh: thời gian ghé, độ khó, mùa đẹp, khoảng cách, thời gian xe máy, buổi nên đi. */
export function QuickFacts({ place }: { readonly place: PlaceView }) {
  const away = mainAway(place);
  const slotNames = SLOTS.filter((s) => place.bestSlots.includes(s.code)).map((s) => COPY.slots[s.code]).join(', ');
  const facts = [
    { icon: 'clock', value: place.duration, label: COPY.place.factDuration },
    { icon: 'gauge', value: place.difficulty, label: COPY.place.factLevel },
    { icon: 'calendar-event', value: place.bestLabel, label: COPY.place.factSeason },
    { icon: 'route', value: away ? fill(COPY.units.kmApprox, { km: away.km }) : COPY.units.noValue, label: fill(COPY.place.factAway, { ref: away?.refName ?? '' }) },
    { icon: 'motorbike', value: away ? formatTravelTime(away.minutes) : COPY.units.noValue, label: COPY.place.factMoto },
    { icon: 'sun', value: slotNames || COPY.units.noValue, label: COPY.place.factSlots },
  ] as const;
  return (
    <ul className="facts">
      {facts.map((f) => (
        <li key={f.label}>
          <span className="ib">
            <Icon semantic name={f.icon} />
          </span>
          <b>{f.value}</b>
          <span>{f.label}</span>
        </li>
      ))}
    </ul>
  );
}

/** Các điểm nổi bật dạng nhãn. */
export function Highlights({ place }: { readonly place: PlaceView }) {
  return (
    <div>
      <h4>
        <Icon name="sparkles" />
        {COPY.place.whatsHere}
      </h4>
      <div className="chips">
        {place.highlights.map((h) => (
          <span key={h} className="chip tint">
            <Icon name="check" size="s" />
            {h}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Bốn buổi trong ngày: buổi nên đi được tô và ghi "Nên đi", kèm lý do. */
export function TimeOfDay({ place }: { readonly place: PlaceView }) {
  return (
    <div>
      <h4>
        <Icon semantic name="sun" />
        {COPY.place.whenToGo}
      </h4>
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
    </div>
  );
}

/** Mười hai tháng, tháng đẹp được tô. */
export function SeasonMonths({ place }: { readonly place: PlaceView }) {
  const months = Array.from({ length: UI.MONTHS_IN_YEAR }, (_, i) => i + 1);
  return (
    <div>
      <h4>
        <Icon semantic name="calendar-event" />
        {COPY.place.bestSeason}
      </h4>
      <div className="months">
        {months.map((m) => (
          <i key={m} className={place.bestMonths.includes(m) ? 'best' : undefined}>
            {m}
          </i>
        ))}
      </div>
    </div>
  );
}

/** Mẹo của Wander (bản nháp biên tập). */
export function Tips({ place }: { readonly place: PlaceView }) {
  return (
    <div className="tipbox">
      <h4>
        <Icon name="bulb" />
        {COPY.place.tips}
      </h4>
      {place.tips.map((t) => (
        <p key={t}>
          <Icon name="check" size="s" />
          {t}
        </p>
      ))}
    </div>
  );
}

/** Đoạn "Về nơi này" thu gọn 4 dòng, bấm "Xem thêm" để mở hết (mô tả lấy từ Wikipedia, CC BY-SA). */
export function About({ place }: { readonly place: PlaceView }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <h4>
        <Icon name="info-circle" />
        {COPY.place.about}
      </h4>
      <p className={open ? 'body' : 'body clamp'}>{place.summary || COPY.place.noSummary}</p>
      <button className="linkbtn" type="button" onClick={() => setOpen((o) => !o)}>
        {open ? COPY.common.seeLess : COPY.common.seeMore}
      </button>
    </div>
  );
}

/** Ghi công dữ liệu và ảnh (bắt buộc theo giấy phép): tác giả, giấy phép, liên kết gốc, bài Wikipedia. */
export function DataCredits({ place }: { readonly place: PlaceView }) {
  return (
    <details>
      <summary>{COPY.place.dataTitle}</summary>
      <div className="credits spaced">
        <span>{COPY.place.dataNote}</span>
        {place.photos.map((p, k) => (
          <span key={p.url}>
            {fill(COPY.place.photoN, { n: k + 1, author: p.author || COPY.place.unknownAuthor, license: p.license })}
            {' · '}
            <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer">
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
    </details>
  );
}

/** Liên kết mở vị trí trên OpenStreetMap (chỉ khi địa điểm có tọa độ). */
export function OsmLink({ place }: { readonly place: PlaceView }) {
  if (place.lat == null || place.lon == null) return null;
  const href = `https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lon}#map=13/${place.lat}/${place.lon}`;
  return (
    <p className="body">
      <a href={href} target="_blank" rel="noopener noreferrer">
        {COPY.place.openOsm}
      </a>
    </p>
  );
}
