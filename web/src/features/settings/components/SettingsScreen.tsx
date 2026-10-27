import { useState } from 'react';
import { VIEW } from '../../../shared/const/routes.const.ts';
import { navigate } from '../../../shared/router/hashRoute.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { WarnBox } from '../../../shared/ui/Controls.tsx';
import { Field } from '../../../shared/ui/Field.tsx';
import { IconButton } from '../../../shared/ui/IconButton.tsx';
import { useToast } from '../../../shared/ui/Toast.tsx';
import { parseDeviceName, useIdentity, useReportError } from '../../identity/index.ts';
import { InterestsSection } from './InterestsSection.tsx';
import { SETTINGS_COPY as T } from '../model/settings.copy.ts';

/** Biểu mẫu đổi tên: dựng khi đã biết tên hiện tại nên ô nhập không bao giờ khởi đầu rỗng rồi lưu đè tên thật. */
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

/** Mục "Thiết bị này": đổi tên thiết bị (có danh tính mới đổi được). */
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

/** Màn Cài đặt (S21): tên thiết bị, Bảo mật, Về Wander, Quyền riêng tư (bản nháp), chuyến đi tạo nhầm (DR-004), xem lại giới thiệu. */
export function SettingsScreen() {
  return (
    <>
      <div className="pagehead pad-x">
        <div>
          <IconButton icon="chevron-left" label={T.back} onClick={() => navigate(VIEW.TRIPS)} />
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
