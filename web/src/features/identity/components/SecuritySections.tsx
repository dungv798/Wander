import { useState } from 'react';
import { ApiError } from '../../../shared/api/ApiError.ts';
import { fill } from '../../../shared/const/copy.vi.ts';
import { PairingCode } from '../../../shared/domain/PairingCode.ts';
import { useNow } from '../../../shared/hooks/useNow.ts';
import { agoText } from '../../../shared/lib/agoText.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { WarnBox } from '../../../shared/ui/Controls.tsx';
import { Field } from '../../../shared/ui/Field.tsx';
import { Icon } from '../../../shared/ui/Icon.tsx';
import { IDENTITY_API } from '../api/identityApi.const.ts';
import { useAttemptLock, useIdentity } from '../hooks/identityContext.ts';
import { replacementSession } from '../hooks/issueSpecs.ts';
import { useReportError } from '../hooks/useReportError.ts';
import { IDENTITY } from '../model/identity.const.ts';
import { IDENTITY_COPY as C } from '../model/identity.copy.ts';
import type { IdentitySnapshot } from '../model/identity.types.ts';
import type { ReauthAttempt } from '../model/identityFlow.types.ts';

const MINUTE_TICK_MS = 30_000;

/**
 * Mục "Mã khôi phục": đã có mã (tạo mã mới cần xác thực lại bằng mã hiện hành hoặc thiết bị khác) hoặc chưa có (cảnh báo nhẹ và cho
 * tạo ngay, MĐ-2). Mã do máy chủ sinh và không bao giờ hiện lại.
 */
export function CodeSection() {
  const { identity, actions, startFlow, closeFlow } = useIdentity();
  const report = useReportError();
  /** Thử một bằng chứng để xin mã mới: đúng thì mở luồng hiện mã (true); chưa đủ bằng chứng thì false; lỗi khác ném ra. */
  const attempt: ReauthAttempt = async (evidence) => {
    try {
      const begun = await actions.beginReplacement(evidence);
      startFlow({ kind: 'issue', issue: { purpose: 'regen', open: async () => replacementSession(actions, begun), onDone: closeFlow, onOpenFailed: report } });
      return true;
    } catch (e) {
      if (e instanceof ApiError && e.code === IDENTITY_API.STEP_UP_REQUIRED) return false;
      throw e;
    }
  };
  /** Chưa có mã hiện hành nên không cần bằng chứng (MĐ-2): xin mã đầu tiên ngay. */
  const issueFirst = (): void =>
    startFlow({ kind: 'issue', issue: { purpose: 'first', open: async () => replacementSession(actions, await actions.beginReplacement()), onDone: closeFlow, onOpenFailed: report } });
  return (
    <section className="seccard">
      <h2 className="h2">{C.security.codeTitle}</h2>
      {identity?.hasCode ? (
        <>
          <p className="note">
            <Icon name="check" size="s" />
            {C.security.codeHas}
          </p>
          <Button kind="ghost" block icon="key" onClick={() => startFlow({ kind: 'reauth', title: C.reauth.regenTitle, why: C.reauth.regenWhy, attempt })}>
            {C.security.codeRegen}
          </Button>
        </>
      ) : (
        <>
          <WarnBox>{C.security.codeNone}</WarnBox>
          <Button block icon="key" onClick={issueFirst}>
            {C.security.codeIssue}
          </Button>
        </>
      )}
    </section>
  );
}

/** Mục "Thiết bị tin cậy": máy này ghi "Đang dùng"; các máy khác có nút Thu hồi (không cần xác thực lại). Tên máy là tự khai, chưa xác minh. */
export function DevicesSection({ identity }: { readonly identity: IdentitySnapshot }) {
  const { startFlow } = useIdentity();
  const now = useNow(MINUTE_TICK_MS);
  return (
    <section className="seccard">
      <h2 className="h2">{C.security.devicesTitle}</h2>
      <p className="note">{C.security.devicesNote}</p>
      {identity.devices.map((d) => (
        <div key={d.id} className="devrow">
          <span className="ib">
            <Icon name="device-mobile" size="l" />
          </span>
          <div>
            <b>{d.name}</b>
            <span className="note">{d.current ? C.security.current : fill(C.security.lastActive, { ago: agoText(d.at, now) })}</span>
          </div>
          {d.current ? null : (
            <Button kind="ghost" aria-label={fill(C.security.revokeAria, { name: d.name })} onClick={() => startFlow({ kind: 'revoke', deviceId: d.id })}>
              {C.security.revoke}
            </Button>
          )}
        </div>
      ))}
    </section>
  );
}

/** Mục "Hoạt động gần đây": tối đa 8 dòng mới nhất, mỗi dòng có "x phút trước". */
export function ActivitySection({ identity }: { readonly identity: IdentitySnapshot }) {
  const now = useNow(MINUTE_TICK_MS);
  return (
    <section className="seccard">
      <h2 className="h2">{C.security.activityTitle}</h2>
      {identity.events.length ? (
        <ul className="evlist">
          {identity.events.slice(0, IDENTITY.SHOWN_EVENTS).map((e, i) => (
            <li key={`${e.at}-${e.kind}-${i}`}>
              <span>{fill(C.security.events[e.kind], { device: e.device ?? '' })}</span>
              <span className="note">{agoText(e.at, now)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="note">{C.security.activityNone}</p>
      )}
      <p className="note">{C.security.activityHint}</p>
    </section>
  );
}

/** Mã báo mã ghép/mã duyệt sai, hết hạn hoặc đã xử lý (một thông báo chung, không lộ loại, MĐ-8). */
const WRONG_APPROVAL_ERRORS: readonly string[] = [IDENTITY_API.INVALID_PAIRING_CODE, IDENTITY_API.INVALID_APPROVAL_CODE];

/**
 * Mục "Thêm thiết bị mới": nhập mã ghép XXXX-XXXX hiện trên máy mới (hoặc mã duyệt của một thao tác xác thực lại); máy chủ cho xem
 * trước và mở tờ duyệt có số khớp. Sai quá 5 lần ở máy này thì khóa tạm (D23).
 */
export function PairSection() {
  const { actions, startFlow } = useIdentity();
  const report = useReportError();
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const { locked, failed, fail, reset } = useAttemptLock('pair');
  /** Tra mã; đúng thì mở tờ duyệt, sai/hết hạn thì đếm lần thử (bền, khóa tạm khi sai đủ 5 lần). */
  const submit = (): void => {
    const parsed = PairingCode.parse(value);
    if (!parsed) {
      fail();
      return;
    }
    setBusy(true);
    actions.preview(parsed.format()).then((preview) => {
      reset();
      setValue('');
      startFlow({ kind: 'pairConfirm', preview });
    }).catch((e: unknown) => {
      if (e instanceof ApiError && WRONG_APPROVAL_ERRORS.includes(e.code)) fail();
      else report(e);
    }).finally(() => setBusy(false));
  };
  return (
    <section className="seccard">
      <h2 className="h2">{C.pair.title}</h2>
      <p className="note">{C.pair.text}</p>
      <Field code label={C.pair.label} value={value} onChange={setValue} placeholder={C.pair.placeholder} disabled={locked} hint={C.pair.help} />
      {failed || locked ? <WarnBox>{locked ? C.pair.locked : C.pair.bad}</WarnBox> : null}
      <Button block disabled={locked || busy} onClick={submit}>
        {C.pair.next}
      </Button>
    </section>
  );
}
