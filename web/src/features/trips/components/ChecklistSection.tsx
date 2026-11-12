import { useState } from 'react';
import { fill } from '../../../shared/const/copy.vi.ts';
import { LIMITS } from '../../../shared/const/limits.const.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { Field } from '../../../shared/ui/Field.tsx';
import { Icon } from '../../../shared/ui/Icon.tsx';
import { useToast } from '../../../shared/ui/Toast.tsx';
import { COLLAB_COPY as C, collabGateway, useLoaded } from '../../collab/index.ts';
import type { ChecklistItem } from '../../collab/index.ts';
import { useReportError } from '../../identity/index.ts';
import { useTripView } from '../hooks/TripViewContext.tsx';
import { groupChecklist } from '../model/checklistGroups.ts';
import { permissionsOf } from '../model/tripPermissions.ts';

/** One item: the tick box of oneself, the shared progress 'x/y people' and (Organizer) a two-tap delete button. */
function ChecklistRow({ item, people, organizer, busy, onToggle, onRemove }: {
  readonly item: ChecklistItem;
  readonly people: number;
  readonly organizer: boolean;
  readonly busy: boolean;
  readonly onToggle: (item: ChecklistItem) => void;
  readonly onRemove: (item: ChecklistItem) => void;
}) {
  const [sure, setSure] = useState(false);
  return (
    <li className="chk">
      <button className="taskchk" type="button" aria-pressed={item.done} aria-label={fill(C.checklist.tickAria, { title: item.title })} disabled={busy} onClick={() => onToggle(item)}>
        <Icon name="check" />
      </button>
      <div className="chk-tx">
        <span className={item.done ? 'done' : undefined}>{item.title}</span>
        {people > 1 ? <small className="note">{fill(C.checklist.progress, { done: item.doneBy.length, total: people })}</small> : null}
      </div>
      {organizer ? (
        <Button
          kind="ghost"
          aria-label={fill(C.checklist.removeAria, { title: item.title })}
          disabled={busy}
          onClick={() => {
            if (sure) onRemove(item);
            else setSure(true);
          }}
        >
          {sure ? fill(C.checklist.removeSure, { title: item.title }) : C.checklist.remove}
        </Button>
      ) : null}
    </li>
  );
}

/** The form that adds an item (Organizer only): an optional group and the item name. */
function AddChecklist({ onAdd, busy }: { readonly onAdd: (group: string, title: string) => Promise<boolean>; readonly busy: boolean }) {
  const [group, setGroup] = useState('');
  const [title, setTitle] = useState('');
  return (
    <div className="stack tight">
      <Field label={C.checklist.groupLabel} value={group} onChange={setGroup} maxLength={LIMITS.MAX_CHECKLIST_GROUP} />
      <Field label={C.checklist.titleLabel} value={title} onChange={setTitle} maxLength={LIMITS.MAX_CHECKLIST_TITLE} />
      <Button
        kind="ghost"
        block
        icon="plus"
        disabled={busy || !title.trim()}
        onClick={() => void onAdd(group, title).then((ok) => (ok ? setTitle('') : undefined))}
      >
        {C.checklist.add}
      </Button>
    </div>
  );
}

/** The 'Prepare before the trip' section: each person ticks their own part (D10), everyone sees the progress; the Organizer adds/deletes items. */
export function ChecklistSection() {
  const { trip } = useTripView();
  const toast = useToast();
  const report = useReportError();
  const list = useLoaded(() => collabGateway.checklist(trip.id), [trip.id]);
  const [busy, setBusy] = useState(false);
  const organizer = permissionsOf(trip).organizer;
  const run = (work: Promise<unknown>, message: string | null): Promise<boolean> => {
    setBusy(true);
    return work.then(() => {
      if (message) toast.show(message);
      list.reload();
      return true;
    }).catch((e: unknown) => {
      report(e);
      return false;
    }).finally(() => setBusy(false));
  };
  const items = list.data ?? [];
  if (!items.length && !organizer && !list.error) return null;
  return (
    <section className="seccard">
      <h2>{C.checklist.title}</h2>
      <p className="note">{C.checklist.hint}</p>
      {list.data && !items.length ? <p className="note">{C.checklist.emptyOrganizer}</p> : null}
      {!list.data && list.error ? <p className="note">{C.checklist.loadFail} <Button kind="ghost" onClick={list.reload}>{C.checklist.retry}</Button></p> : null}
      {groupChecklist(items).map((g) => (
        <div key={g.group}>
          <h3>{g.group || C.checklist.noGroup}</h3>
          <ul className="chklist">
            {g.items.map((i) => (
              <ChecklistRow
                key={i.id}
                item={i}
                people={trip.memberCount}
                organizer={organizer}
                busy={busy}
                onToggle={(it) => void run(collabGateway.setChecklistDone(trip.id, it.id, !it.done), null)}
                onRemove={(it) => void run(collabGateway.removeChecklist(trip.id, it.id), C.checklist.removed)}
              />
            ))}
          </ul>
        </div>
      ))}
      {organizer ? <AddChecklist busy={busy} onAdd={(group, title) => run(collabGateway.addChecklist(trip.id, { group, title }), C.checklist.added)} /> : null}
    </section>
  );
}
