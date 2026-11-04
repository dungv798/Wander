import { useState } from 'react';
import { fill } from '../../../shared/const/copy.vi.ts';
import { LIMITS } from '../../../shared/const/limits.const.ts';
import { VIEW } from '../../../shared/const/routes.const.ts';
import { addDays, fullDate, nextWeekday, parseIsoDate, todayLocal } from '../../../shared/lib/dates.ts';
import { navigate } from '../../../shared/router/hashRoute.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { WarnBox } from '../../../shared/ui/Controls.tsx';
import { Field } from '../../../shared/ui/Field.tsx';
import { Sheet } from '../../../shared/ui/Sheet.tsx';
import { useToast } from '../../../shared/ui/Toast.tsx';
import { firstPhotoUrl } from '../../discover/index.ts';
import { useReportError, useRequireIdentity } from '../../identity/index.ts';
import { useCreateFromTemplate } from '../../trips/index.ts';
import type { TemplateView } from '../model/template.types.ts';
import { DEFAULT_START_WEEKDAY } from '../model/templates.const.ts';
import { TEMPLATES_COPY as T } from '../model/templates.copy.ts';

interface SheetProps {
  readonly template: TemplateView;
  readonly destId: string;
  readonly onClose: () => void;
}

/** Danh sách theo ngày của lịch mẫu: tên + khu vực từng nơi (ảnh nhỏ), ghi chú ngày và dòng nhắc khi ngày chưa có nơi mới. */
function TemplateDays({ template }: { readonly template: TemplateView }) {
  return (
    <div className="stack">
      {template.days.map((d, k) => (
        <section key={`${template.id}-${k}`} className="tpl-day">
          <h3>{fill(T.sheet.day, { n: k + 1 })}</h3>
          {d.places.length ? (
            <ul className="tpl-places">
              {d.places.map((p) => (
                <li key={p.id}>
                  <img alt="" src={firstPhotoUrl(p)} loading="lazy" />
                  <span>
                    <b>{p.name}</b>
                    <span className="note">{p.area}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="note">{T.sheet.emptyDay}</p>
          )}
          {d.note ? <p className="note">{d.note}</p> : null}
        </section>
      ))}
    </div>
  );
}

/** Biểu mẫu tạo chuyến từ lịch mẫu: tên + ngày đi (ngày về tự tính). Lỗi chỉ hiện sau khi bấm tạo, ngay trong tờ. */
function UseForm({ template, destId, onBack, onClose }: SheetProps & { readonly onBack: () => void }) {
  const toast = useToast();
  const requireIdentity = useRequireIdentity();
  const create = useCreateFromTemplate();
  const report = useReportError();
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState(template.title);
  const [start, setStart] = useState(() => nextWeekday(todayLocal(), DEFAULT_START_WEEKDAY));
  const [error, setError] = useState('');
  const valid = parseIsoDate(start) !== null;
  /** Kiểm tra rồi (qua cổng danh tính) tạo chuyến, mở chuyến và báo đã tạo. */
  const submit = (): void => {
    const trimmed = name.trim();
    if (!trimmed) return setError(T.sheet.errors.name);
    if (trimmed.length > LIMITS.MAX_TRIP_NAME) return setError(fill(T.sheet.errors.nameLong, { max: LIMITS.MAX_TRIP_NAME }));
    if (!valid) return setError(T.sheet.errors.date);
    requireIdentity(() => {
      setBusy(true);
      return create({ name: trimmed, destinationId: destId, startDate: start, days: template.days.map((d) => d.places) }).then((trip) => {
        onClose();
        navigate(VIEW.TRIP, trip.id, 'ov');
        toast.show(fill(T.sheet.created, { name: trip.name }));
        return true;
      }).catch((e: unknown) => {
        report(e);
        return false;
      }).finally(() => setBusy(false));
    });
  };
  return (
    <div className="pp">
      <div>
        <h2>{fill(T.sheet.formTitle, { title: template.title })}</h2>
        <p className="note spaced">{fill(T.sheet.formText, { days: template.days.length })}</p>
      </div>
      <Field label={T.sheet.name} value={name} maxLength={LIMITS.MAX_TRIP_NAME} onChange={setName} />
      <Field label={T.sheet.start} type="date" value={start} onChange={setStart} hint={valid ? `${fullDate(start)} → ${fill(T.sheet.end, { date: fullDate(addDays(start, template.days.length - 1)) })}` : ''} />
      {error ? <WarnBox>{error}</WarnBox> : null}
      <div className="stack">
        <Button block disabled={busy} onClick={submit}>{T.sheet.create}</Button>
        <Button kind="ghost" block onClick={onBack}>{T.sheet.back}</Button>
      </div>
    </div>
  );
}

/** Tờ chi tiết một lịch mẫu: tóm tắt, nhãn "Bản nháp" nếu chưa duyệt, các ngày; "Dùng lịch này" mở biểu mẫu tạo chuyến. */
export function TemplateSheet({ template, destId, onClose }: SheetProps) {
  const [using, setUsing] = useState(false);
  return (
    <Sheet label={template.title} onClose={onClose}>
      {using ? (
        <UseForm template={template} destId={destId} onBack={() => setUsing(false)} onClose={onClose} />
      ) : (
        <div className="pp">
          <div>
            <h2>{template.title}</h2>
            {template.summary ? <p className="note spaced">{template.summary}</p> : null}
          </div>
          {template.status === 'draft' ? <WarnBox>{T.sheet.draftNote}</WarnBox> : null}
          {template.status === 'reference' ? <WarnBox role="status">{T.sheet.referenceNote}</WarnBox> : null}
          <TemplateDays template={template} />
          <div className="stack">
            <Button block onClick={() => setUsing(true)}>{T.sheet.use}</Button>
            <Button kind="ghost" block onClick={onClose}>{T.sheet.close}</Button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
