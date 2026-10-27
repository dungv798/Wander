import { useCallback, useEffect, useState } from 'react';
import { api, clearToken, errorText } from './api';
import type { SessionInfo } from './api';
import { CodeSetup } from './CodeSetup';
import { Card, ErrorText } from './ui';

export function Security({ onSignedOut }: { onSignedOut: () => void }) {
  return (
    <div className="stack">
      <p>
        <a href="#/trips">← Các chuyến</a>
      </p>
      <h1>Bảo mật</h1>
      <p className="muted">Thiết kế phần này đang chờ chủ sản phẩm duyệt (release gate RG-1). Chưa dùng cho người dùng thật.</p>
      <CodeSection />
      <DevicesSection onSignedOut={onSignedOut} />
      <ApproveSection />
    </div>
  );
}

function CodeSection() {
  const [status, setStatus] = useState<{ hasCode: boolean; createdAt: string | null } | null>(null);
  const [mode, setMode] = useState<'idle' | 'code' | 'approval'>('idle');
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('');
  const [stepUp, setStepUp] = useState<{ requestId: string; approvalCode: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api
      .codeStatus()
      .then(setStatus)
      .catch((e: unknown) => setError(errorText(e)));
  }, []);
  useEffect(load, [load]);

  async function requestApproval() {
    setError(null);
    try {
      const r = await api.stepUpRequest();
      setStepUp({ requestId: r.requestId, approvalCode: r.approvalCode });
      setMode('approval');
    } catch (e) {
      setError(errorText(e));
    }
  }

  const getEvidence = (): Record<string, unknown> | undefined => {
    if (!status?.hasCode) return undefined;
    if (mode === 'code') return { type: 'code', code: current };
    if (mode === 'approval' && stepUp) return { type: 'approval', requestId: stepUp.requestId };
    return undefined;
  };

  return (
    <Card title="Mã khôi phục">
      <ErrorText text={error} />
      {status === null ? <p className="muted">Đang tải…</p> : null}
      {status && !open ? (
        <>
          <p>{status.hasCode ? 'Bạn đang có một mã khôi phục.' : 'Bạn chưa có mã khôi phục. Nếu mất thiết bị này, bạn sẽ mất các chuyến.'}</p>
          <button type="button" onClick={() => setOpen(true)}>
            {status.hasCode ? 'Tạo mã khôi phục mới' : 'Tạo mã khôi phục'}
          </button>
        </>
      ) : null}
      {status && open ? (
        <>
          {status.hasCode && mode === 'idle' ? (
            <div className="stack">
              <p>Để tạo mã mới, hãy xác thực lại bằng một trong hai cách:</p>
              <label>
                Nhập mã khôi phục hiện tại
                <input value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="off" spellCheck={false} />
              </label>
              <button type="button" disabled={current.trim() === ''} onClick={() => setMode('code')}>
                Dùng mã hiện tại
              </button>
              <button type="button" className="secondary" onClick={() => void requestApproval()}>
                Duyệt từ thiết bị khác
              </button>
            </div>
          ) : null}
          {status.hasCode && mode === 'approval' && stepUp ? (
            <p>
              Trên thiết bị khác đang đăng nhập, mở <strong>Bảo mật</strong> và nhập mã phê duyệt <strong data-testid="approval-code">{stepUp.approvalCode}</strong>. Duyệt xong, bấm bên dưới.
            </p>
          ) : null}
          {!status.hasCode || mode !== 'idle' ? (
            <CodeSetup
              intro="Tạo mã khôi phục mới. Mã cũ (nếu có) vẫn dùng được cho đến khi bạn xác nhận mã mới."
              startLabel={mode === 'approval' ? 'Tôi đã duyệt, tiếp tục' : 'Tạo mã'}
              getEvidence={getEvidence}
              onDone={() => {
                setOpen(false);
                setMode('idle');
                setCurrent('');
                setStepUp(null);
                load();
              }}
            />
          ) : null}
        </>
      ) : null}
    </Card>
  );
}

function DevicesSection({ onSignedOut }: { onSignedOut: () => void }) {
  const [sessions, setSessions] = useState<SessionInfo[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api
      .sessions()
      .then((r) => setSessions(r.sessions))
      .catch((e: unknown) => setError(errorText(e)));
  }, []);
  useEffect(load, [load]);

  async function revoke(s: SessionInfo) {
    const msg = s.current ? 'Đăng xuất thiết bị này? Bạn cần mã khôi phục hoặc thiết bị khác để mở lại.' : 'Thu hồi quyền của thiết bị này?';
    if (!window.confirm(msg)) return;
    try {
      await api.revokeSession(s.id);
      if (s.current) {
        clearToken();
        onSignedOut();
      } else {
        load();
      }
    } catch (e) {
      setError(errorText(e));
    }
  }

  return (
    <Card title="Thiết bị đang đăng nhập">
      <ErrorText text={error} />
      <ul className="list">
        {(sessions ?? []).map((s) => (
          <li key={s.id}>
            <div>
              <strong>{s.current ? 'Thiết bị này' : 'Thiết bị khác'}</strong>
              <div className="muted">
                Bắt đầu {new Date(s.createdAt).toLocaleString('vi-VN')} · gần nhất {new Date(s.lastSeenAt).toLocaleString('vi-VN')}
              </div>
            </div>
            <button type="button" className="secondary" onClick={() => void revoke(s)}>
              {s.current ? 'Đăng xuất' : 'Thu hồi'}
            </button>
          </li>
        ))}
      </ul>
      <p className="muted">Khôi phục bằng mã không tự thu hồi các thiết bị khác. Nếu nghi ngờ có thiết bị lạ, hãy thu hồi nó ở đây.</p>
    </Card>
  );
}

function ApproveSection() {
  const [pairing, setPairing] = useState('');
  const [approval, setApproval] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function approveDevice() {
    setError(null);
    setMessage(null);
    try {
      await api.approveDevice(pairing);
      setMessage('Đã duyệt thiết bị mới.');
      setPairing('');
    } catch (e) {
      setError(errorText(e));
    }
  }

  async function approveStepUp() {
    setError(null);
    setMessage(null);
    try {
      await api.stepUpApprove(approval);
      setMessage('Đã duyệt yêu cầu xác thực lại.');
      setApproval('');
    } catch (e) {
      setError(errorText(e));
    }
  }

  return (
    <Card title="Duyệt cho thiết bị khác">
      <ErrorText text={error} />
      {message ? <p className="ok">{message}</p> : null}
      <label>
        Mã ghép từ thiết bị mới (thêm thiết bị)
        <input value={pairing} onChange={(e) => setPairing(e.target.value)} autoComplete="off" spellCheck={false} placeholder="XXXX-XXXX" />
      </label>
      <button type="button" disabled={pairing.trim() === ''} onClick={() => void approveDevice()}>
        Duyệt thiết bị mới
      </button>
      <label>
        Mã phê duyệt từ thiết bị khác (xác thực lại)
        <input value={approval} onChange={(e) => setApproval(e.target.value)} autoComplete="off" spellCheck={false} placeholder="XXXX-XXXX" />
      </label>
      <button type="button" className="secondary" disabled={approval.trim() === ''} onClick={() => void approveStepUp()}>
        Duyệt yêu cầu
      </button>
    </Card>
  );
}
