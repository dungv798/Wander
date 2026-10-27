import { useState } from 'react';
import { api, errorText } from './api';
import { CodeBox, ErrorText } from './ui';

type Step = 'intro' | 'show' | 'done';

/**
 * Phát hành mã khôi phục theo hai pha (D23, D24, D26): tạo mã chờ → hiển thị một lần → nhập lại để xác nhận → mã mới mới có hiệu lực.
 * `getEvidence` trả về bằng chứng xác thực lại khi danh tính đã có mã (D25).
 */
export function CodeSetup(props: {
  intro: string;
  startLabel: string;
  getEvidence?: () => Record<string, unknown> | undefined;
  onDone: () => void;
  onSkip?: () => void;
}) {
  const [step, setStep] = useState<Step>('intro');
  const [pending, setPending] = useState<{ pendingId: string; code: string } | null>(null);
  const [typed, setTyped] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function begin() {
    setBusy(true);
    setError(null);
    try {
      const r = await api.beginCode(props.getEvidence?.());
      setPending({ pendingId: r.pendingId, code: r.replacementCode });
      setTyped('');
      setStep('show');
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    if (!pending) return;
    setBusy(true);
    setError(null);
    try {
      await api.confirmCode(pending.pendingId, typed);
      setStep('done');
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  if (step === 'done') {
    return (
      <div>
        <p className="ok">Mã khôi phục đã có hiệu lực. Hãy giữ mã ở nơi an toàn.</p>
        <button type="button" onClick={props.onDone}>
          Tiếp tục
        </button>
      </div>
    );
  }

  if (step === 'show' && pending) {
    return (
      <div>
        <p>
          Đây là mã khôi phục của bạn. <strong>Mã chỉ hiển thị một lần.</strong> Hãy chép và lưu ở nơi an toàn, ví dụ trình quản lý mật khẩu.
        </p>
        <CodeBox code={pending.code} />
        <p className="warn">
          Nếu mất mã này và không còn thiết bị nào đang đăng nhập, bạn sẽ <strong>mất quyền truy cập các chuyến vĩnh viễn</strong>. Không ai, kể cả chúng tôi, khôi phục
          giúp được.
        </p>
        <label>
          Nhập lại mã để xác nhận bạn đã lưu
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
          />
        </label>
        <ErrorText text={error} />
        <div className="row">
          <button type="button" disabled={busy || typed.trim() === ''} onClick={() => void confirm()}>
            Xác nhận
          </button>
          <button type="button" className="secondary" disabled={busy} onClick={() => void begin()}>
            Tạo mã khác
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p>{props.intro}</p>
      <ErrorText text={error} />
      <div className="row">
        <button type="button" disabled={busy} onClick={() => void begin()}>
          {props.startLabel}
        </button>
        {props.onSkip ? (
          <button
            type="button"
            className="secondary"
            onClick={() => {
              if (
                window.confirm(
                  'Nếu không có mã khôi phục và bạn mất thiết bị này, bạn có thể mất quyền truy cập các chuyến vĩnh viễn. Bạn vẫn muốn bỏ qua?',
                )
              ) {
                props.onSkip?.();
              }
            }}
          >
            Bỏ qua
          </button>
        ) : null}
      </div>
    </div>
  );
}
