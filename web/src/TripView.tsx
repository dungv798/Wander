import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiFailure, errorText, ITEM_TYPES } from './api';
import type { DayView, Item, TripDetail } from './api';
import { Card, ErrorText, formatDateVi, shortDateVi } from './ui';

function formatDuration(min: number): string {
  if (min < 60) return `${min} phút`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} giờ` : `${h} giờ ${m} phút`;
}

export function TripView({ tripId }: { tripId: string }) {
  const [detail, setDetail] = useState<TripDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [editing, setEditing] = useState<Item | null>(null);
  const [showTrash, setShowTrash] = useState(false);
  const [editingTrip, setEditingTrip] = useState(false);
  const [undo, setUndo] = useState<{ id: string; title: string } | null>(null);
  const undoTimer = useRef<number | undefined>(undefined);

  const load = useCallback(async () => {
    try {
      setDetail(await api.getTrip(tripId));
      setError(null);
    } catch (e) {
      setError(errorText(e));
    }
  }, [tripId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => () => window.clearTimeout(undoTimer.current), []);

  async function act(fn: () => Promise<unknown>) {
    setError(null);
    try {
      await fn();
      await load();
    } catch (e) {
      setError(errorText(e));
    }
  }

  async function remove(item: Item) {
    await act(async () => {
      await api.deleteItem(tripId, item.id);
      setUndo({ id: item.id, title: item.title });
      window.clearTimeout(undoTimer.current);
      undoTimer.current = window.setTimeout(() => setUndo(null), 8000);
    });
  }

  async function doUndo() {
    if (!undo) return;
    const id = undo.id;
    setUndo(null);
    await act(() => api.restoreItem(tripId, id));
  }

  async function move(day: DayView, index: number, delta: -1 | 1) {
    const ids = day.items.map((i) => i.id);
    const j = index + delta;
    if (j < 0 || j >= ids.length) return;
    [ids[index], ids[j]] = [ids[j]!, ids[index]!];
    await act(() => api.reorder(tripId, day.date, ids));
  }

  if (!detail) {
    return (
      <div className="stack">
        <p>
          <a href="#/">← Các chuyến</a>
        </p>
        <ErrorText text={error} />
        {!error ? <p className="muted">Đang tải…</p> : null}
      </div>
    );
  }

  const { trip } = detail;
  return (
    <div className="stack">
      <p>
        <a href="#/">← Các chuyến</a>
      </p>
      <header className="tripheader">
        <h1>{trip.name}</h1>
        <p className="muted">
          {trip.destination} · {formatDateVi(trip.startDate)} – {formatDateVi(trip.endDate)} · {detail.dayCount} ngày
        </p>
        <div className="total" data-testid="total">
          <span>Tổng phải trả thêm</span>
          <strong>{detail.totals.extraFormatted}</strong>
          <small className="muted">Không gồm khoản đã bao gồm và mục chưa rõ giá.</small>
        </div>
        <div className="row">
          <button type="button" className="secondary" onClick={() => setEditingTrip((v) => !v)}>
            Sửa chuyến
          </button>
          <button type="button" className="secondary" onClick={() => setShowTrash((v) => !v)}>
            Đã xóa gần đây ({detail.trashCount})
          </button>
        </div>
      </header>

      <ErrorText text={error} />

      <Summary detail={detail} />
      <PendingTasks detail={detail} onToggle={(id) => void act(() => api.setDone(tripId, id, true))} />

      {editingTrip ? (
        <EditTrip
          detail={detail}
          onClose={() => setEditingTrip(false)}
          onSaved={() => {
            setEditingTrip(false);
            void load();
          }}
        />
      ) : null}

      {showTrash ? <Trash tripId={tripId} onChanged={() => void load()} /> : null}

      {detail.days.map((day) => (
        <section key={day.date} className="day" aria-label={`Ngày ${day.index}`}>
          <h2>
            Ngày {day.index} · {day.weekdayLabel} {shortDateVi(day.date)}
          </h2>
          <ul className="items">
            {day.items.map((item, idx) => (
              <li key={item.id} className={`item t-${item.type}`}>
                {editing?.id === item.id ? (
                  <ItemForm
                    detail={detail}
                    initial={item}
                    day={item.day}
                    submitLabel="Lưu"
                    onCancel={() => setEditing(null)}
                    onSubmit={async (payload) => {
                      await api.updateItem(tripId, item.id, payload);
                      setEditing(null);
                      await load();
                    }}
                  />
                ) : (
                  <ItemRow
                    item={item}
                    first={idx === 0}
                    last={idx === day.items.length - 1}
                    onUp={() => void move(day, idx, -1)}
                    onDown={() => void move(day, idx, 1)}
                    onEdit={() => setEditing(item)}
                    onDelete={() => void remove(item)}
                    onToggle={(done) => void act(() => api.setDone(tripId, item.id, done))}
                  />
                )}
              </li>
            ))}
          </ul>
          {day.items.length === 0 ? <p className="muted">Chưa có mục nào.</p> : null}
          {adding === day.date ? (
            <ItemForm
              detail={detail}
              day={day.date}
              submitLabel="Thêm"
              quick
              onCancel={() => setAdding(null)}
              onSubmit={async (payload) => {
                await api.createItem(tripId, payload);
                await load();
              }}
            />
          ) : (
            <button type="button" className="secondary add" onClick={() => setAdding(day.date)}>
              + Thêm mục
            </button>
          )}
        </section>
      ))}

      {undo ? (
        <div className="toast" role="status">
          Đã xóa «{undo.title}».{' '}
          <button type="button" className="link" onClick={() => void doUndo()}>
            Hoàn tác
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ItemRow(props: {
  item: Item;
  first: boolean;
  last: boolean;
  onUp: () => void;
  onDown: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (done: boolean) => void;
}) {
  const { item } = props;
  const showUnknown = item.costK === null && !item.included && item.type !== 'rest' && item.type !== 'task';
  return (
    <div className="itemrow">
      <div className="itemmain">
        {item.type === 'task' ? (
          <input type="checkbox" checked={item.done} aria-label={`Hoàn thành: ${item.title}`} onChange={(e) => props.onToggle(e.target.checked)} />
        ) : null}
        <div>
          <div className="itemtitle">
            <span className="chip">{item.typeLabel}</span>
            {item.timeOfDay ? <span className="time">{item.timeOfDay}</span> : null}
            <strong className={item.type === 'task' && item.done ? 'done' : undefined}>{item.title}</strong>
            {item.durationMin !== null ? <span className="muted"> · {formatDuration(item.durationMin)}</span> : null}
          </div>
          <div className="itemmeta">
            {item.included ? (
              <span className="tag">Đã bao gồm{item.referenceFormatted ? ` · tham khảo ${item.referenceFormatted}` : ''}</span>
            ) : item.costFormatted ? (
              <span className="cost">{item.costFormatted}</span>
            ) : showUnknown ? (
              <span className="muted">Chưa rõ giá</span>
            ) : null}
            {item.note ? <span className="muted"> · {item.note}</span> : null}
          </div>
        </div>
      </div>
      <div className="actions">
        <button type="button" className="icon" onClick={props.onUp} disabled={props.first} aria-label={`Đưa «${item.title}» lên`}>
          Lên
        </button>
        <button type="button" className="icon" onClick={props.onDown} disabled={props.last} aria-label={`Đưa «${item.title}» xuống`}>
          Xuống
        </button>
        <button type="button" className="icon" onClick={props.onEdit} aria-label={`Sửa «${item.title}»`}>
          Sửa
        </button>
        <button type="button" className="icon danger" onClick={props.onDelete} aria-label={`Xóa «${item.title}»`}>
          Xóa
        </button>
      </div>
    </div>
  );
}

interface FormState {
  title: string;
  type: string;
  day: string;
  time: string;
  duration: string;
  cost: string;
  included: boolean;
  reference: string;
  note: string;
}

function ItemForm(props: {
  detail: TripDetail;
  initial?: Item;
  day: string;
  submitLabel: string;
  quick?: boolean;
  onCancel: () => void;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const i = props.initial;
  const [f, setF] = useState<FormState>({
    title: i?.title ?? '',
    type: i?.type ?? 'sightseeing',
    day: props.day,
    time: i?.timeOfDay ?? '',
    duration: i?.durationMin?.toString() ?? '',
    cost: i?.costK?.toString() ?? '',
    included: i?.included ?? false,
    reference: i?.referenceK?.toString() ?? '',
    note: i?.note ?? '',
  });
  const [more, setMore] = useState(!props.quick);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((s) => ({ ...s, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await props.onSubmit({
        day: f.day,
        type: f.type,
        title: f.title,
        timeOfDay: f.time,
        durationMin: f.duration,
        note: f.note,
        cost: f.cost,
        included: f.included,
        referenceCost: f.included ? f.reference : '',
      });
      if (props.quick) {
        // Thêm liên tiếp: giữ loại, xóa phần còn lại để nhập mục kế.
        setF((s) => ({ ...s, title: '', time: '', duration: '', cost: '', included: false, reference: '', note: '' }));
      }
    } catch (err) {
      setError(err instanceof ApiFailure && err.field ? `${errorText(err)}` : errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="itemform" onSubmit={(e) => void submit(e)}>
      <div className="chips" role="radiogroup" aria-label="Loại mục">
        {ITEM_TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            role="radio"
            aria-checked={f.type === t.value}
            className={f.type === t.value ? 'chip on' : 'chip'}
            onClick={() => set('type', t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <label>
        Tiêu đề
        <input value={f.title} onChange={(e) => set('title', e.target.value)} maxLength={200} autoFocus required />
      </label>
      {more ? (
        <div className="stack">
          {!props.quick ? (
            <label>
              Ngày
              <select value={f.day} onChange={(e) => set('day', e.target.value)}>
                {props.detail.days.map((d) => (
                  <option key={d.date} value={d.date}>
                    Ngày {d.index} · {d.weekdayLabel} {shortDateVi(d.date)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <div className="row">
            <label>
              Giờ (tùy chọn)
              <input type="time" value={f.time} onChange={(e) => set('time', e.target.value)} />
            </label>
            <label>
              Thời lượng (phút)
              <input inputMode="numeric" value={f.duration} onChange={(e) => set('duration', e.target.value)} />
            </label>
          </div>
          <label>
            Chi phí (nghìn đồng, bỏ trống nếu chưa rõ)
            <input inputMode="numeric" value={f.cost} onChange={(e) => set('cost', e.target.value)} placeholder="Ví dụ 150 = 150.000 ₫" />
          </label>
          <label className="check">
            <input type="checkbox" checked={f.included} onChange={(e) => set('included', e.target.checked)} /> Đã bao gồm (không cộng vào tổng)
          </label>
          {f.included ? (
            <label>
              Giá tham khảo (nghìn đồng)
              <input inputMode="numeric" value={f.reference} onChange={(e) => set('reference', e.target.value)} />
            </label>
          ) : null}
          <label>
            Ghi chú
            <input value={f.note} onChange={(e) => set('note', e.target.value)} maxLength={2000} />
          </label>
        </div>
      ) : null}
      <ErrorText text={error} />
      <div className="row">
        <button type="submit" disabled={busy}>
          {props.submitLabel}
        </button>
        {props.quick ? (
          <button type="button" className="secondary" onClick={() => setMore((v) => !v)}>
            {more ? 'Ít chi tiết hơn' : 'Thêm chi tiết'}
          </button>
        ) : null}
        <button type="button" className="secondary" onClick={props.onCancel}>
          {props.quick ? 'Xong' : 'Hủy'}
        </button>
      </div>
    </form>
  );
}

function EditTrip({ detail, onClose, onSaved }: { detail: TripDetail; onClose: () => void; onSaved: () => void }) {
  const { trip } = detail;
  const [name, setName] = useState(trip.name);
  const [destination, setDestination] = useState(trip.destination);
  const [startDate, setStartDate] = useState(trip.startDate);
  const [endDate, setEndDate] = useState(trip.endDate);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.updateTrip(trip.id, { name, destination, startDate, endDate });
      onSaved();
    } catch (err) {
      if (err instanceof ApiFailure && err.code === 'DATES_ORPHAN_ITEMS') {
        const dates = ((err.details as { dates?: string[] } | undefined)?.dates ?? []).map(formatDateVi).join(', ');
        setError(`Còn mục nằm ngoài khoảng ngày mới (${dates}). Hãy chuyển sang ngày khác hoặc xóa vĩnh viễn các mục đó (kể cả trong "Đã xóa gần đây") trước.`);
      } else {
        setError(errorText(err));
      }
    }
  }

  return (
    <Card title="Sửa chuyến">
      <form className="stack" onSubmit={(e) => void submit(e)}>
        <label>
          Tên chuyến
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required />
        </label>
        <label>
          Điểm đến
          <input value={destination} onChange={(e) => setDestination(e.target.value)} maxLength={200} required />
        </label>
        <div className="row">
          <label>
            Ngày đi
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          </label>
          <label>
            Ngày về
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
          </label>
        </div>
        <ErrorText text={error} />
        <div className="row">
          <button type="submit">Lưu</button>
          <button type="button" className="secondary" onClick={onClose}>
            Hủy
          </button>
        </div>
      </form>
    </Card>
  );
}

function Trash({ tripId, onChanged }: { tripId: string; onChanged: () => void }) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api
      .trash(tripId)
      .then((r) => setItems(r.items))
      .catch((e: unknown) => setError(errorText(e)));
  }, [tripId]);
  useEffect(load, [load]);

  async function run(fn: () => Promise<unknown>) {
    setError(null);
    try {
      await fn();
      load();
      onChanged();
    } catch (e) {
      setError(errorText(e));
    }
  }

  return (
    <Card title="Đã xóa gần đây">
      <ErrorText text={error} />
      {items && items.length === 0 ? <p className="muted">Không có mục nào. Mục đã xóa được giữ ở đây cho đến khi bạn xóa vĩnh viễn.</p> : null}
      <ul className="list">
        {(items ?? []).map((it) => (
          <li key={it.id}>
            <div>
              <strong>{it.title}</strong>
              <div className="muted">
                {it.typeLabel} · ngày {shortDateVi(it.day)}
              </div>
            </div>
            <div className="row">
              <button type="button" className="secondary" onClick={() => void run(() => api.restoreItem(tripId, it.id))}>
                Khôi phục
              </button>
              <button
                type="button"
                className="secondary danger"
                onClick={() => {
                  if (window.confirm(`Xóa vĩnh viễn «${it.title}»? Không thể khôi phục sau đó.`)) void run(() => api.permanentDelete(tripId, it.id));
                }}
              >
                Xóa vĩnh viễn
              </button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Summary({ detail }: { detail: TripDetail }) {
  const byDay = detail.totals.byDay;
  return (
    <details className="card summary">
      <summary>Tổng theo ngày và theo loại</summary>
      <h3>Theo loại</h3>
      {detail.totals.byType.length === 0 ? <p className="muted">Chưa có mục nào.</p> : null}
      <ul className="list compact" data-testid="by-type">
        {detail.totals.byType.map((t) => (
          <li key={t.type}>
            <span>{t.typeLabel}</span>
            <strong>{t.extraFormatted}</strong>
          </li>
        ))}
      </ul>
      <h3>Theo ngày</h3>
      <ul className="list compact" data-testid="by-day">
        {byDay.map((d, i) => (
          <li key={d.date}>
            <span>
              Ngày {i + 1} · {shortDateVi(d.date)}
            </span>
            <strong>{d.extraFormatted}</strong>
          </li>
        ))}
      </ul>
      <p className="muted">Cùng quy tắc với tổng chung: không gồm khoản đã bao gồm, mục chưa rõ giá và mục đã xóa.</p>
    </details>
  );
}

function PendingTasks({ detail, onToggle }: { detail: TripDetail; onToggle: (id: string) => void }) {
  if (detail.pendingTasks.length === 0) return null;
  return (
    <Card title={`Việc cần làm chưa xong (${detail.pendingTasks.length})`}>
      <ul className="list compact" data-testid="pending-tasks">
        {detail.pendingTasks.map((t) => (
          <li key={t.id}>
            <label className="check">
              <input type="checkbox" checked={false} onChange={() => onToggle(t.id)} aria-label={`Hoàn thành: ${t.title}`} />
              <span>
                {t.timeOfDay ? <span className="time">{t.timeOfDay} </span> : null}
                {t.title}
              </span>
            </label>
            <span className="muted">{shortDateVi(t.day)}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
