import { useEffect, useState } from 'react';
import { apiClient } from '../../../shared/api/defaultClient.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { ChipToggle } from '../../../shared/ui/Controls.tsx';
import { useToast } from '../../../shared/ui/Toast.tsx';
import { CATEGORY_ICON, CATEGORY_NAME } from '../../discover/index.ts';
import { useIdentity, useReportError } from '../../identity/index.ts';
import { HttpPreferencesGateway } from '../api/HttpPreferencesGateway.ts';
import { SETTINGS_COPY as T } from '../model/settings.copy.ts';

/** The screen's shared store: calls the backend's preferences API. The catalog of interest kinds is a fixed vocabulary (`TripInterest` in the backend), independent of the destination. */
const GATEWAY = new HttpPreferencesGateway(apiClient);

/** Chooses/clears a code in the list (keeping the order of choosing). */
function toggled(list: readonly string[], code: string): string[] {
  return list.includes(code) ? list.filter((c) => c !== code) : [...list, code];
}

/** The interest-choosing form: loads the value stored on the server, then lets the user choose/clear and save (replacing everything). Built only once there is an identity. */
function InterestsForm() {
  const report = useReportError();
  const toast = useToast();
  const [chosen, setChosen] = useState<readonly string[] | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    GATEWAY.interests().then((codes) => {
      if (live) setChosen(codes);
    }).catch((e: unknown) => {
      if (live) report(e);
    });
    return () => {
      live = false;
    };
  }, [report]);

  /** Saves to the server; on success it takes back the normalized list. */
  const save = (): void => {
    setBusy(true);
    GATEWAY.saveInterests(chosen ?? []).then((codes) => {
      setChosen(codes);
      toast.show(T.interests.saved);
    }).catch(report).finally(() => setBusy(false));
  };

  if (chosen === null) return <p className="note">{T.interests.loading}</p>;
  return (
    <>
      <div className="chips" role="group" aria-label={T.interests.group}>
        {Object.entries(CATEGORY_NAME).map(([code, name]) => (
          <ChipToggle key={code} icon={CATEGORY_ICON[code as keyof typeof CATEGORY_ICON]} pressed={chosen.includes(code)} onClick={() => setChosen(toggled(chosen, code))}>
            {name}
          </ChipToggle>
        ))}
      </div>
      <Button block disabled={busy} onClick={save}>
        {T.interests.save}
      </Button>
    </>
  );
}

/** The 'What are you into?' section in Settings: interests stored PER IDENTITY (they remain on another device), used for later suggestions. With no identity yet it says plainly how to get one. */
export function InterestsSection() {
  const { identity } = useIdentity();
  return (
    <section className="seccard">
      <h2 className="h2">{T.interests.title}</h2>
      <p className="note">{T.interests.text}</p>
      {identity ? <InterestsForm /> : <p className="note">{T.interests.none}</p>}
    </section>
  );
}
