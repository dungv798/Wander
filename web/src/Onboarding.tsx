import { useState } from 'react';
import { api, errorText, setToken } from './api';
import { CodeSetup } from './CodeSetup';
import { Card, ErrorText } from './ui';

export function Onboarding({ onReady }: { onReady: () => void }) {
  const [step, setStep] = useState<'welcome' | 'code'>('welcome');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const r = await api.createIdentity();
      setToken(r.token);
      setStep('code');
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  if (step === 'code') {
    return (
      <Card title="Mã khôi phục">
        <CodeSetup
          intro="Wander không cần tài khoản. Mã khôi phục là cách duy nhất để lấy lại các chuyến nếu bạn mất thiết bị này. Bạn có thể tạo mã ngay bây giờ hoặc để sau trong mục Bảo mật."
          startLabel="Tạo mã khôi phục"
          onDone={onReady}
          onSkip={onReady}
        />
      </Card>
    );
  }

  return (
    <Card title="Chào mừng đến với Wander">
      <p>Lập kế hoạch chuyến đi theo từng ngày, theo dõi chi phí và mở lại trên bất kỳ thiết bị nào. Không cần tạo tài khoản.</p>
      <ErrorText text={error} />
      <div className="stack">
        <button type="button" disabled={busy} onClick={() => void start()}>
          Bắt đầu lập kế hoạch
        </button>
        <a className="button secondary" href="#/recover">
          Tôi đã có chuyến trên thiết bị khác
        </a>
      </div>
    </Card>
  );
}
