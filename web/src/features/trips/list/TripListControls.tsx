import { useState } from 'react';
import { fill } from '../../../shared/const/copy.vi.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { ChipToggle } from '../../../shared/ui/Controls.tsx';
import { Icon } from '../../../shared/ui/Icon.tsx';
import { Sheet } from '../../../shared/ui/Sheet.tsx';
import type { TripListOptions, TripStatus } from './tripList.ts';
import { TRIP_SORTS, TRIP_STATUSES } from './tripList.ts';
import { LIST_COPY as L } from './list.copy.ts';
import './tripList.css';

/** Barre tìm/lọc gọn; tờ chọn áp dụng ngay và giữ các lựa chọn khác. */
export function TripListControls({ options, counts, onChange }: { readonly options: TripListOptions; readonly counts: Readonly<Record<TripStatus, number>>; readonly onChange: (value: TripListOptions) => void }) {
  const [sorting, setSorting] = useState(false);
  return <section className="trip-list-controls stack pad-x" aria-label={L.filters}>
    <label className="search trip-list-search glass-control">
      <Icon name="compass" />
      <input type="search" aria-label={L.search} placeholder={L.search} value={options.query} onChange={e => onChange({ ...options, query: e.target.value })} />
    </label>
    <div className="trip-list-chips" role="group" aria-label={L.filters}>
      {TRIP_STATUSES.map(status => <ChipToggle key={status} pressed={options.status === status} onClick={() => onChange({ ...options, status: options.status === status ? null : status })}>{`${L.status[status]} (${counts[status]})`}</ChipToggle>)}
    </div>
    <Button kind="ghost" icon="arrow-up" onClick={() => setSorting(true)}>{fill(L.sortLabel, { sort: L.sort[options.sort] })}</Button>
    {sorting ? <Sheet label={L.sortTitle} onClose={() => setSorting(false)}><div className="pp">
      <h2>{L.sortTitle}</h2>
      <div className="daylist">{TRIP_SORTS.map(sort => <button key={sort} type="button" aria-current={sort === options.sort ? 'true' : undefined} onClick={() => { onChange({ ...options, sort }); setSorting(false); }}>{L.sort[sort]}</button>)}</div>
      <Button kind="ghost" block onClick={() => setSorting(false)}>{L.close}</Button>
    </div></Sheet> : null}
  </section>;
}
