import { useState } from 'react';
import { ApiError } from '../../../shared/api/ApiError.ts';
import { DEMO_ERROR_CODES } from '../../../shared/api/errorMessages.const.ts';
import type { ErrorAction } from '../../../shared/api/errorMessages.const.ts';
import { IS_DEV } from '../../../shared/const/env.ts';
import { VIEW } from '../../../shared/const/routes.const.ts';
import { navigate } from '../../../shared/router/hashRoute.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { WarnBox } from '../../../shared/ui/Controls.tsx';
import { ErrorBox } from '../../../shared/ui/ErrorBox.tsx';
import { Field } from '../../../shared/ui/Field.tsx';
import { IconButton } from '../../../shared/ui/IconButton.tsx';
import { useToast } from '../../../shared/ui/Toast.tsx';
import { parseDeviceName, useIdentity } from '../../identity/index.ts';
import { SETTINGS_COPY as T } from '../model/settings.copy.ts';

/** Mục "Thiết bị này": đổi tên thiết bị (có danh tính mới đổi được). */
function DeviceSection() {
  const { identity, session, actions } = useIdentity();
  const current = identity?.devices.find((d) => d.id === session.deviceId);
  const toast = useToast();
  const [name, setName] = useState(current?.name ?? '');
  const [error, setError] = useState('');
  if (!current) {
    return (
      <section className="seccard">
        <h2 className="h2">{T.device.title}</h2>
        <p className="note">{T.device.none}</p>
      </section>
    );
  }
  return (
    <section className="seccard">
      <h2 className="h2">{T.device.title}</h2>
      <p className="note">{T.device.text}</p>
      <Field label={T.device.label} value={name} onChange={setName} />
      {error ? <WarnBox>{error}</WarnBox> : null}
      <Button
        block
        onClick={() => {
          const r = parseDeviceName(name);
          if (!r.ok) return setError(r.error);
          setError('');
          actions.renameHere(r.value);
          toast.show(T.device.saved);
        }}
      >
        {T.device.save}
      </Button>
    </section>
  );
}

/** Khu giả lập (chỉ khi phát triển): hết phiên và hộp lỗi theo mã (S20). */
function DemoSection() {
  const { actions } = useIdentity();
  const [code, setCode] = useState<string | null>(null);
  if (!IS_DEV) return null;
  /** Làm theo lối đi của hộp lỗi (bản thử): đóng hộp rồi sang màn tương ứng. */
  const act = (a: ErrorAction): void => {
    setCode(null);
    if (a === 'security') navigate(VIEW.SECURITY);
    else if (a === 'trips') navigate(VIEW.TRIPS);
    else if (a === 'recover') navigate(VIEW.RECOVER);
  };
  return (
    <section className="protobox">
      <b>{T.demo.title}</b>
      <p className="note">{T.demo.note}</p>
      <Button kind="ghost" onClick={actions.expireHere}>
        {T.demo.expire}
      </Button>
      <p className="note">{T.demo.errors}</p>
      <div className="chips">
        {DEMO_ERROR_CODES.map((c) => (
          <button key={c} className="fchip" type="button" onClick={() => setCode(c)}>
            {c}
          </button>
        ))}
      </div>
      {code ? <ErrorBox error={new ApiError(code)} onAction={act} onClose={() => setCode(null)} /> : null}
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
        <DemoSection />
      </div>
    </>
  );
}
