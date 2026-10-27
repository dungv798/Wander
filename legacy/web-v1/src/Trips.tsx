import { useEffect, useState } from 'react';
import { api, errorText } from './api';
import type { Trip } from './api';
import { optionsFromTrip, optionsPayload, TripOptionsFields } from './TripOptionsFields';
import type { TripOptionsValue } from './TripOptionsFields';
import { Card, ErrorText, formatDateVi } from './ui';

export function Trips() {
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api
      .listTrips()
      .then((r) => setTrips(r.trips))
      .catch((e: unknown) => setError(errorText(e)));
  }, []);

  return (
    <div className="stack">
      <div className="row between">
        <h1>Các chuyến của bạn</h1>
        <a className="button secondary" href="#/security">
          Bảo mật
        </a>
      </div>
      <ErrorText text={error} />
      {trips === null && !error ? <p className="muted">Đang tải…</p> : null}
      {trips && trips.length === 0 && !creating ? <p>Bạn chưa có chuyến nào. Hãy tạo chuyến đầu tiên.</p> : null}
      <ul className="list">
        {(trips ?? []).map((t) => (
          <li key={t.id}>
            <a href={`#/trip/${t.id}`} className="triplink">
              <strong>{t.name}</strong>
              <span className="muted">
                {t.destination} · {formatDateVi(t.startDate)} – {formatDateVi(t.endDate)}
              </span>
              {t.styles.length > 0 || t.pace ? (
                <span className="muted" data-testid="trip-list-labels">
                  {[...t.styles.map((s) => s.label), ...(t.pace ? [`nhịp ${t.pace.label.toLowerCase()}`] : [])].join(' · ')}
                </span>
              ) : null}
            </a>
          </li>
        ))}
      </ul>
      {creating ? (
        <NewTrip
          onCancel={() => setCreating(false)}
          onCreated={(t) => {
            window.location.hash = `#/trip/${t.id}`;
          }}
        />
      ) : (
        <button type="button" onClick={() => setCreating(true)}>
          Tạo chuyến mới
        </button>
      )}
    </div>
  );
}

function NewTrip({ onCancel, onCreated }: { onCancel: () => void; onCreated: (t: Trip) => void }) {
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [options, setOptions] = useState<TripOptionsValue>(optionsFromTrip());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await api.createTrip({ name, destination, startDate, endDate, ...optionsPayload(options) });
      onCreated(r.trip);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Chuyến mới">
      <form onSubmit={(e) => void submit(e)} className="stack">
        <label>
          Tên chuyến
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required autoFocus />
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
        <TripOptionsFields value={options} onChange={setOptions} />
        <ErrorText text={error} />
        <div className="row">
          <button type="submit" disabled={busy}>
            Tạo chuyến
          </button>
          <button type="button" className="secondary" onClick={onCancel}>
            Hủy
          </button>
        </div>
      </form>
    </Card>
  );
}
