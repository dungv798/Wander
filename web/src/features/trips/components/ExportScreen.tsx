import { useState } from 'react';
import { fill } from '../../../shared/const/copy.vi.ts';
import { dayMonth } from '../../../shared/lib/dates.ts';
import { goBack } from '../../../shared/router/hashRoute.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { ChipToggle, WarnBox } from '../../../shared/ui/Controls.tsx';
import { EmptyState } from '../../../shared/ui/EmptyState.tsx';
import { IconButton } from '../../../shared/ui/IconButton.tsx';
import { DestinationGate } from '../../discover/index.ts';
import { useTrips } from '../hooks/TripsProvider.tsx';
import { calendarEvents, imageCards, pdfTable, undatedCount } from '../model/exportPreview.ts';
import type { CostCell, ExportKind, NameOf } from '../model/exportPreview.ts';
import type { Trip } from '../model/trip.types.ts';
import { catalogOf, itemName } from '../model/tripView.ts';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';
import { money } from './ItemMeta.tsx';

/** Các kiểu xem trước theo thứ tự hiện. */
const EXPORT_KINDS: readonly ExportKind[] = ['image', 'pdf', 'calendar'];

/** Chữ của một ô chi phí theo D17/D18. */
function costText(c: CostCell): string {
  if (c.kind === 'known') return money(c.k);
  if (c.kind === 'included') return T.export.included;
  return c.kind === 'unknown' ? T.export.unknown : T.export.none;
}

/** Xem trước kiểu Ảnh: một thẻ cho mỗi ngày, màu ngày kèm chữ "Ngày n". */
function ImagePreview({ trip, nameOf }: { readonly trip: Trip; readonly nameOf: NameOf }) {
  return (
    <div className="stack">
      {imageCards(trip, nameOf).map((c) => (
        <section key={c.dayNumber} className="expcard">
          <h3>{c.label ? fill(T.export.day, { n: c.dayNumber, date: c.label }) : fill(T.view.day, { n: c.dayNumber })}</h3>
          {c.names.length ? (
            <ul className="evlist">
              {c.names.map((n, i) => (
                <li key={`${i}-${n}`}>{n}</li>
              ))}
            </ul>
          ) : (
            <p className="note">{T.export.emptyDay}</p>
          )}
        </section>
      ))}
    </div>
  );
}

/** Xem trước kiểu PDF: bảng ngày/giờ/mục/chi phí; tổng chỉ cộng mục đã biết giá, nói rõ số mục chưa biết giá. */
function PdfPreview({ trip, nameOf }: { readonly trip: Trip; readonly nameOf: NameOf }) {
  const t = pdfTable(trip, nameOf);
  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- vùng cuộn ngang phải focus được bằng bàn phím (WCAG 2.1.1)
    <div className="expscroll" tabIndex={0} role="region" aria-label={T.export.pdfCaption}>
      <table className="exptable">
        <caption className="sr">{T.export.pdfCaption}</caption>
        <thead>
          <tr>
            <th scope="col">{T.export.colDay}</th>
            <th scope="col">{T.export.colTime}</th>
            <th scope="col">{T.export.colItem}</th>
            <th scope="col" className="num">{T.export.colCost}</th>
          </tr>
        </thead>
        <tbody>
          {t.rows.map((r, i) => (
            <tr key={`${r.dayNumber}-${i}`}>
              <td>{fill(T.view.day, { n: r.dayNumber })}</td>
              <td>{r.time ?? T.export.none}</td>
              <td>{r.name}</td>
              <td className="num">{costText(r.cost)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3}>{T.export.total}</td>
            <td className="num">{money(t.totalK)}</td>
          </tr>
        </tfoot>
      </table>
      <p className="note">{T.export.totalNote}</p>
      {t.unknownCount ? <p className="note">{fill(T.export.unknownNote, { n: t.unknownCount })}</p> : null}
    </div>
  );
}

/** Xem trước kiểu Lịch: mỗi mục một sự kiện; mục không có giờ là sự kiện cả ngày; nêu múi giờ của thiết bị. */
function CalendarPreview({ trip, nameOf }: { readonly trip: Trip; readonly nameOf: NameOf }) {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (trip.datesTentative) return <WarnBox>{T.export.tentativeCalendar}</WarnBox>;
  return (
    <div className="stack">
      <ul className="evlist">
        {calendarEvents(trip, nameOf).map((e, i) => (
          <li key={`${e.date}-${i}`}>
            <span>{e.title}</span>
            <span className="note">{`${dayMonth(e.date)} · ${e.time ?? T.export.allDay}`}</span>
          </li>
        ))}
      </ul>
      <p className="note">{fill(T.export.tz, { tz })}</p>
    </div>
  );
}

/** Nội dung xem trước đã chọn cùng cảnh báo mục "Chưa có ngày" và nút tạo tệp (tắt, nói thẳng là chưa làm). */
function Preview({ trip, kind, nameOf }: { readonly trip: Trip; readonly kind: ExportKind; readonly nameOf: NameOf }) {
  const undated = undatedCount(trip);
  return (
    <div className="stack pad-x spaced-lg exp-gap">
      <h2 className="h2">{T.export.preview}</h2>
      {trip.datesTentative ? <WarnBox>{T.export.tentative}</WarnBox> : null}
      {undated ? <WarnBox>{fill(T.export.undated, { n: undated })}</WarnBox> : null}
      {kind === 'image' ? <ImagePreview trip={trip} nameOf={nameOf} /> : null}
      {kind === 'pdf' ? <PdfPreview trip={trip} nameOf={nameOf} /> : null}
      {kind === 'calendar' ? <CalendarPreview trip={trip} nameOf={nameOf} /> : null}
      <Button block disabled aria-describedby="export-why">
        {T.export.notYet}
      </Button>
      <p className="note" id="export-why">
        {T.export.notYetText}
      </p>
    </div>
  );
}

/** Màn xem trước "Lưu hoặc gửi lịch trình" (S18, `#/export/<mã chuyến>`): ba kiểu Ảnh/PDF/Lịch từ dữ liệu chuyến thật. Chưa tạo tệp và nói thẳng điều đó. */
export function ExportScreen({ tripId }: { readonly tripId: string }) {
  const { trip: find } = useTrips();
  const trip = find(tripId);
  const [kind, setKind] = useState<ExportKind>('image');
  if (!trip) {
    return <EmptyState role="status" title={T.view.notFoundTitle} text={T.view.notFoundText} actions={<Button onClick={goBack}>{T.view.backToList}</Button>} />;
  }
  return (
    <DestinationGate destId={trip.destinationId}>
      {(dest) => {
        const cat = catalogOf(dest);
        const nameOf: NameOf = (i) => itemName(i, cat);
        return (
          <>
            <div className="pagehead pad-x">
              <div>
                <IconButton icon="chevron-left" label={T.export.back} onClick={goBack} />
              </div>
              <p className="note">{trip.name}</p>
              <h1>{T.export.title}</h1>
            </div>
            <div className="stack pad-x">
              <div className="chips" role="group" aria-label={T.export.kinds}>
                {EXPORT_KINDS.map((k) => (
                  <ChipToggle key={k} pressed={kind === k} onClick={() => setKind(k)}>
                    {T.export[k]}
                  </ChipToggle>
                ))}
              </div>
            </div>
            <Preview trip={trip} kind={kind} nameOf={nameOf} />
          </>
        );
      }}
    </DestinationGate>
  );
}
