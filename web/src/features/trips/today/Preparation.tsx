import { useState } from 'react';
import { fill } from '../../../shared/const/copy.vi.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { collabGateway, useLoaded } from '../../collab/index.ts';
import type { ChecklistItem } from '../../collab/index.ts';
import { useReportError } from '../../identity/index.ts';
import { TODAY_COPY as C } from './today.copy.ts';

/** The viewer's own checklist opened with one tap, it does not report completion while the API has not returned data. */
export function Preparation({ tripId }: { readonly tripId: string }) {
  const list = useLoaded(() => collabGateway.checklist(tripId), [tripId]);
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const report = useReportError();
  const missing = list.data?.filter((item) => !item.done) ?? [];
  /** Waits for the server to confirm and then reloads; an error keeps the tick box and notifies through the shared mechanism. */
  const toggle = async (item: ChecklistItem): Promise<void> => {
    setBusy(true);
    try {
      await collabGateway.setChecklistDone(tripId, item.id, !item.done);
      list.reload();
    } catch (error) { report(error); }
    finally { setBusy(false); }
  };
  return (
    <section className="today-prepare panel">
      <h2>{C.prepare}</h2>
      {list.error ? <p>{C.loadFail} <Button kind="ghost" onClick={list.reload}>{C.retry}</Button></p> : null}
      {!list.data && !list.error ? <p role="status">{C.loading}</p> : null}
      {list.data ? <>
        <p className="note">{!list.data.length ? C.noChecklist : missing.length ? fill(C.missing, { n: missing.length }) : C.prepared}</p>
        <Button kind="ghost" block aria-expanded={expanded} aria-controls="today-checklist" onClick={() => setExpanded(!expanded)}>{expanded ? C.closeChecklist : C.openChecklist}</Button>
        <ul id="today-checklist" className="today-checklist">
          {(expanded ? list.data : missing).map((item) => <li key={item.id}>
            {expanded ? <label><input type="checkbox" checked={item.done} disabled={busy} onChange={() => void toggle(item)} />{item.title}</label> : item.title}
          </li>)}
        </ul>
      </> : null}
    </section>
  );
}
