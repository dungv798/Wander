import { useState } from 'react';
import { VIEW } from '../../../shared/const/routes.const.ts';
import { goBack, navigate } from '../../../shared/router/hashRoute.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { WarnBox } from '../../../shared/ui/Controls.tsx';
import { Field } from '../../../shared/ui/Field.tsx';
import { IconButton } from '../../../shared/ui/IconButton.tsx';
import { useToast } from '../../../shared/ui/Toast.tsx';
import { parseDeviceName, useIdentity, useReportError } from '../../identity/index.ts';
import { InterestsSection } from './InterestsSection.tsx';
import { SETTINGS_COPY as T } from '../model/settings.copy.ts';

/** The rename form: built once the current name is known so the input never starts empty and then overwrites the real name when saved. */
function DeviceForm({ initial }: { readonly initial: string }) {
  const { actions } = useIdentity();
  const report = useReportError();
  const toast = useToast();
  const [name, setName] = useState(initial);
  const [error, setError] = useState('');
  return (
    <>
      <Field label={T.device.label} value={name} onChange={setName} />
      {error ? <WarnBox>{error}</WarnBox> : null}
      <Button
        block
        onClick={() => {
          const r = parseDeviceName(name);
          if (!r.ok) return setError(r.error);
          setError('');
          actions.renameHere(r.value).then(() => toast.show(T.device.saved)).catch(report);
        }}
      >
        {T.device.save}
      </Button>
    </>
  );
}

/** The 'This device' section: rename the device (it can only be renamed once there is an identity). */
function DeviceSection() {
  const { identity } = useIdentity();
  const current = identity?.devices.find((d) => d.current);
  return (
    <section className="seccard">
      <h2 className="h2">{T.device.title}</h2>
      {current ? (
        <>
          <p className="note">{T.device.text}</p>
          <DeviceForm initial={current.name} />
        </>
      ) : (
        <p className="note">{T.device.none}</p>
      )}
    </section>
  );
}

/** The Settings screen (S21): the device name, Security, About Wander, Privacy (a draft), trips created by mistake (DR-004), replay the intro. */
export function SettingsScreen() {
  return (
    <>
      <div className="pagehead pad-x">
        <div>
          <IconButton icon="chevron-left" label={T.back} onClick={goBack} />
        </div>
        <p className="note">{T.eyebrow}</p>
        <h1>{T.title}</h1>
      </div>
      <div className="stack pad-x spaced-lg">
        <DeviceSection />
        <InterestsSection />
        <section className="seccard">
          <h2 className="h2">{T.security.title}</h2>
          <p className="note">{T.security.text}</p>
          <Button kind="ghost" block icon="shield" onClick={() => navigate(VIEW.SECURITY)}>
            {T.security.open}
          </Button>
        </section>
        <section className="seccard">
          <h2 className="h2">{T.intro.title}</h2>
          <p className="note">{T.intro.text}</p>
          <Button kind="ghost" block onClick={() => navigate(VIEW.ONBOARD)}>
            {T.intro.replay}
          </Button>
        </section>
        <section className="seccard">
          <h2 className="h2">{T.about.title}</h2>
          <p className="note">{T.about.text}</p>
          <p className="note">{T.about.credit}</p>
          <p className="note">{T.about.draft}</p>
        </section>
        <section className="seccard">
          <h2 className="h2">{T.privacy.title}</h2>
          <WarnBox>{T.privacy.draft}</WarnBox>
          <ul className="evlist">
            {T.privacy.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </section>
        <section className="seccard">
          <h2 className="h2">{T.mistaken.title}</h2>
          <p className="note">{T.mistaken.text}</p>
        </section>
      </div>
    </>
  );
}
