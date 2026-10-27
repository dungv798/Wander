import { useEffect, useRef, useState } from 'react';
import { api, ApiFailure, errorText, newSessionSecret, setToken } from './api';
import { Card, CodeBox, ErrorText } from './ui';

type Tab = 'code' | 'device';

export function Recover({ onReady }: { onReady: () => void }) {
  const [tab, setTab] = useState<Tab>('code');
  return (
    <Card title="Mở lại chuyến trên thiết bị này">
      <div className="tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'code'} className={tab === 'code' ? 'tab on' : 'tab'} onClick={() => setTab('code')}>
          Dùng mã khôi phục
        </button>
        <button type="button" role="tab" aria-selected={tab === 'device'} className={tab === 'device' ? 'tab on' : 'tab'} onClick={() => setTab('device')}>
          Duyệt từ thiết bị khác
        </button>
      </div>
      {tab === 'code' ? <RecoverWithCode onReady={onReady} /> : <RecoverWithDevice onReady={onReady} />}
      <p>
        <a href="#/">Quay lại</a>
      </p>
    </Card>
  );
}

/** Khôi phục KP-C (D24): nhập mã → nhận mã thay thế → nhập lại để xác nhận → hoàn tất. Không có cách bỏ qua. */
function RecoverWithCode({ onReady }: { onReady: () => void }) {
  const [code, setCode] = useState('');
  const [typed, setTyped] = useState('');
  // Lần thử và bí mật phiên do thiết bị tự sinh một lần; gửi lại cùng lần thử là idempotent (INV-12).
  const attempt = useRef<{ attemptId: string; secret: string } | null>(null);
  const [replacement, setReplacement] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      attempt.current ??= { attemptId: newSessionSecret().slice(0, 32), secret: newSessionSecret() };
      const r = await api.recoveryStart(code, attempt.current.attemptId, attempt.current.secret);
      setReplacement(r.replacementCode);
      setTyped('');
    } catch (e) {
      setError(errorText(e));
      if (e instanceof ApiFailure && e.code === 'INVALID_CODE') attempt.current = null;
    } finally {
      setBusy(false);
    }
  }

  async function complete() {
    if (!attempt.current) return;
    setBusy(true);
    setError(null);
    try {
      await api.recoveryComplete(attempt.current.attemptId, typed);
      setToken(attempt.current.secret);
      onReady();
    } catch (e) {
      setError(errorText(e));
      if (e instanceof ApiFailure && (e.code === 'ATTEMPT_EXPIRED' || e.code === 'CODE_ALREADY_USED')) {
        attempt.current = null;
        setReplacement(null);
      }
    } finally {
      setBusy(false);
    }
  }

  if (replacement) {
    return (
      <div>
        <p>
          Đây là <strong>mã khôi phục mới</strong> của bạn. Mã cũ chỉ ngừng dùng được khi bạn xác nhận đã lưu mã mới này. <strong>Mã chỉ hiển thị một lần.</strong>
        </p>
        <CodeBox code={replacement} />
        <p className="warn">Nếu mất mã này và không còn thiết bị nào đang đăng nhập, bạn sẽ mất quyền truy cập vĩnh viễn.</p>
        <label>
          Nhập lại mã mới để hoàn tất
          <input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" autoCapitalize="characters" spellCheck={false} />
        </label>
        <ErrorText text={error} />
        <button type="button" disabled={busy || typed.trim() === ''} onClick={() => void complete()}>
          Hoàn tất khôi phục
        </button>
      </div>
    );
  }

  return (
    <div>
      <label>
        Mã khôi phục
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
        />
      </label>
      <ErrorText text={error} />
      <button type="button" disabled={busy || code.trim() === ''} onClick={() => void start()}>
        Tiếp tục
      </button>
    </div>
  );
}

/** Thiết bị mới tự sinh bí mật phiên và hiển thị mã ghép; thiết bị đang đăng nhập nhập mã đó để duyệt (D21). */
function RecoverWithDevice({ onReady }: { onReady: () => void }) {
  const [link, setLink] = useState<{ requestId: string; pairingCode: string } | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'pending' | 'approved' | 'expired'>('pending');
  const [busy, setBusy] = useState(false);

  async function create() {
    setBusy(true);
    setError(null);
    try {
      const s = newSessionSecret();
      const r = await api.deviceLinkCreate(s);
      setSecret(s);
      setLink({ requestId: r.requestId, pairingCode: r.pairingCode });
      setStatus('pending');
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!link || !secret || status !== 'pending') return;
    const id = window.setInterval(() => {
      api
        .deviceLinkStatus(link.requestId)
        .then((r) => {
          setStatus(r.status);
          if (r.status === 'approved') {
            setToken(secret);
            onReady();
          }
        })
        .catch(() => undefined);
    }, 2000);
    return () => window.clearInterval(id);
  }, [link, secret, status, onReady]);

  if (link && status === 'pending') {
    return (
      <div>
        <p>
          Trên thiết bị đã đăng nhập, mở <strong>Bảo mật</strong> và nhập mã ghép dưới đây. Mã hết hạn sau vài phút.
        </p>
        <CodeBox code={link.pairingCode} />
        <p className="muted">Đang chờ thiết bị kia duyệt…</p>
      </div>
    );
  }

  return (
    <div>
      {status === 'expired' ? <p className="warn">Mã ghép đã hết hạn. Hãy tạo mã mới.</p> : null}
      <p>Bạn cần một thiết bị đang đăng nhập Wander để duyệt thiết bị này.</p>
      <ErrorText text={error} />
      <button type="button" disabled={busy} onClick={() => void create()}>
        Tạo mã ghép
      </button>
    </div>
  );
}
