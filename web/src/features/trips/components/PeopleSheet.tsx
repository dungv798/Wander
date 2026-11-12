import { useEffect, useState } from 'react';
import { LIMITS } from '../../../shared/const/limits.const.ts';
import { fill } from '../../../shared/const/copy.vi.ts';
import { VIEW } from '../../../shared/const/routes.const.ts';
import { copyText } from '../../../shared/lib/clipboard.ts';
import { navigate } from '../../../shared/router/hashRoute.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { WarnBox } from '../../../shared/ui/Controls.tsx';
import { Field } from '../../../shared/ui/Field.tsx';
import { Icon } from '../../../shared/ui/Icon.tsx';
import { Sheet } from '../../../shared/ui/Sheet.tsx';
import { useToast } from '../../../shared/ui/Toast.tsx';
import { COLLAB_COPY as C, collabGateway, useLoaded } from '../../collab/index.ts';
import type { CreatedInvite, Member } from '../../collab/index.ts';
import { useReportError } from '../../identity/index.ts';
import { useTrips } from '../hooks/TripsProvider.tsx';
import { useTripView } from '../hooks/TripViewContext.tsx';
import { permissionsOf } from '../model/tripPermissions.ts';

/** The full invite link from the code (the code is after the # so it never reaches the web server or the access log). */
function inviteLink(code: string): string {
  return `${window.location.origin}${window.location.pathname}#/join/${code}`;
}

/** The member list: the name (self-declared), the role badge by the server's \`role\` (not by the name) and a Remove button for the Organizer. */
function MemberList({ members, canRemove, onRemove }: { readonly members: readonly Member[]; readonly canRemove: boolean; readonly onRemove: (m: Member) => void }) {
  return (
    <ul className="evlist">
      {members.map((m) => (
        <li key={m.id}>
          <span>
            <Icon name="users" size="s" /> {m.self ? C.roles.you : m.displayName}{' '}
            <b className="chip tint">{m.role === 'organizer' ? C.roles.organizer : C.roles.member}</b>
          </span>
          {canRemove && m.role !== 'organizer' ? (
            <Button kind="ghost" aria-label={fill(C.people.removeAria, { name: m.displayName })} onClick={() => onRemove(m)}>{C.people.remove}</Button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

/** The Organizer's invite section: create/revoke a link, show the NEW link exactly once with a copy button. */
function InvitePanel({ tripId }: { readonly tripId: string }) {
  const toast = useToast();
  const report = useReportError();
  const status = useLoaded(() => collabGateway.invite(tripId), [tripId]);
  const [fresh, setFresh] = useState<CreatedInvite | null>(null);
  const [busy, setBusy] = useState(false);
  const run = (work: Promise<unknown>, message: string): void => {
    setBusy(true);
    work.then(() => {
      toast.show(message);
      status.reload();
    }).catch(report).finally(() => setBusy(false));
  };
  const create = (): void => run(collabGateway.createInvite(tripId).then(setFresh), C.invite.created);
  const revoke = (): void => run(collabGateway.revokeInvite(tripId).then(() => setFresh(null)), C.invite.revoked);
  const copy = (): void => void copyText(inviteLink(fresh?.code ?? '')).then((ok) => toast.show(ok ? C.invite.copied : C.invite.copyFail));
  const invite = status.data;
  const active = invite?.active === true;
  return (
    <section className="seccard">
      <h3>{C.invite.title}</h3>
      <p className="note">{C.invite.text}</p>
      {fresh ? (
        <>
          <p className="note">{C.invite.fresh}</p>
          <Field label={C.invite.linkLabel} value={inviteLink(fresh.code)} onChange={() => undefined} readOnly />
          <Button block onClick={copy}>{C.invite.copy}</Button>
        </>
      ) : null}
      <p className="note">{active && invite ? fill(C.invite.active, { date: new Date(invite.expiresAt).toLocaleDateString('vi-VN') }) : C.invite.none}</p>
      <Button kind={active ? 'ghost' : 'primary'} block disabled={busy} onClick={create}>{active ? C.invite.createNew : C.invite.create}</Button>
      {active ? <Button kind="ghost" block disabled={busy} onClick={revoke}>{C.invite.revoke}</Button> : null}
    </section>
  );
}

/** The regular member's section: change the display name and leave the trip (asks again once). */
function SelfPanel({ tripId, current, onRenamed }: { readonly tripId: string; readonly current: string; readonly onRenamed: () => void }) {
  const toast = useToast();
  const report = useReportError();
  const { reload } = useTrips();
  const [name, setName] = useState(current);
  const [sure, setSure] = useState(false);
  const [busy, setBusy] = useState(false);
  const save = (): void => {
    setBusy(true);
    collabGateway.rename(tripId, name.trim()).then((m) => {
      setName(m.displayName);
      toast.show(C.people.renamed);
      onRenamed();
    }).catch(report).finally(() => setBusy(false));
  };
  const leave = (): void => {
    setBusy(true);
    collabGateway.leave(tripId).then(() => {
      toast.show(C.people.left);
      reload();
      navigate(VIEW.TRIPS);
    }).catch((e: unknown) => {
      report(e);
      setBusy(false);
    });
  };
  return (
    <section className="seccard">
      <Field label={C.people.renameLabel} value={name} onChange={setName} maxLength={LIMITS.MAX_DISPLAY_NAME} />
      <Button kind="ghost" block disabled={busy || !name.trim()} onClick={save}>{C.people.renameSave}</Button>
      {sure ? (
        <>
          <WarnBox>{C.people.leaveText}</WarnBox>
          <Button kind="danger" block disabled={busy} onClick={leave}>{C.people.leaveConfirm}</Button>
          <Button kind="ghost" block onClick={() => setSure(false)}>{C.people.cancel}</Button>
        </>
      ) : (
        <Button kind="danger" block onClick={() => setSure(true)}>{C.people.leave}</Button>
      )}
    </section>
  );
}

/** The 'Travel companions' sheet: the member list; the Organizer invites people and removes people; a member renames/leaves the trip. */
export function PeopleSheet({ onClose }: { readonly onClose: () => void }) {
  const { trip, setOverlay } = useTripView();
  const perms = permissionsOf(trip);
  const toast = useToast();
  const report = useReportError();
  const { reload } = useTrips();
  const members = useLoaded(() => collabGateway.members(trip.id), [trip.id]);
  const [removing, setRemoving] = useState<Member | null>(null);
  const [busy, setBusy] = useState(false);
  const { refreshTrip } = useTrips().actions;
  const count = members.data?.length;
  useEffect(() => {
    if (count !== undefined && count !== trip.memberCount) void refreshTrip(trip.id).catch(() => undefined); // a new person joined/left from another device
  }, [count, trip.id, trip.memberCount, refreshTrip]);
  const self = members.data?.find((m) => m.self);
  const remove = (m: Member): void => {
    setBusy(true);
    collabGateway.removeMember(trip.id, m.id).then(() => {
      toast.show(fill(C.people.removed, { name: m.displayName }));
      setRemoving(null);
      members.reload();
      reload();
    }).catch(report).finally(() => setBusy(false));
  };
  return (
    <Sheet label={C.people.title} onClose={onClose}>
      <div className="pp">
        <h2>{C.people.title}</h2>
        <p className="note">{C.people.namesNote}</p>
        {perms.organizer ? <p className="note">{C.people.organizerNote}</p> : null}
        <div className="people-shortcuts">
          <Button kind="ghost" icon="list-check" onClick={() => setOverlay({ kind: 'checklist' })}>{C.checklist.title}</Button>
          <Button kind="ghost" icon="list-check" onClick={() => setOverlay({ kind: 'requests' })}>{C.requests.title}</Button>
        </div>
        {members.data ? <MemberList members={members.data} canRemove={perms.manageTrip} onRemove={setRemoving} /> : members.error ? <WarnBox>{C.people.loadFail}<Button kind="ghost" onClick={members.reload}>{C.people.retry}</Button></WarnBox> : <p className="note">{C.people.loading}</p>}
        {removing ? (
          <section className="seccard">
            <b>{fill(C.people.removeTitle, { name: removing.displayName })}</b>
            <p className="note">{C.people.removeText}</p>
            <Button kind="danger" block disabled={busy} onClick={() => remove(removing)}>{C.people.removeConfirm}</Button>
            <Button kind="ghost" block onClick={() => setRemoving(null)}>{C.people.cancel}</Button>
          </section>
        ) : null}
        {perms.manageTrip ? <InvitePanel tripId={trip.id} /> : null}
        {!perms.organizer && self ? <SelfPanel tripId={trip.id} current={self.displayName} onRenamed={members.reload} /> : null}
        <Button kind="ghost" block onClick={onClose}>{C.people.close}</Button>
      </div>
    </Sheet>
  );
}
