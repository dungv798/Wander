import { useEffect, useState } from 'react';
import { apiClient } from '../../../shared/api/defaultClient.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { ChipToggle } from '../../../shared/ui/Controls.tsx';
import { useToast } from '../../../shared/ui/Toast.tsx';
import { CATEGORY_ICON, CATEGORY_NAME } from '../../discover/index.ts';
import { useIdentity, useReportError } from '../../identity/index.ts';
import { HttpPreferencesGateway } from '../api/HttpPreferencesGateway.ts';
import { SETTINGS_COPY as T } from '../model/settings.copy.ts';

/** Kho dùng chung của màn: gọi API sở thích của backend. Danh mục loại sở thích là từ vựng cố định (`TripInterest` ở backend), không phụ thuộc điểm đến. */
const GATEWAY = new HttpPreferencesGateway(apiClient);

/** Chọn/bỏ một mã trong danh sách (giữ thứ tự chọn). */
function toggled(list: readonly string[], code: string): string[] {
  return list.includes(code) ? list.filter((c) => c !== code) : [...list, code];
}

/** Biểu mẫu chọn sở thích: nạp giá trị đang lưu ở máy chủ rồi cho chọn/bỏ và lưu (thay toàn bộ). Chỉ dựng khi đã có danh tính. */
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

  /** Lưu lên máy chủ; thành công thì lấy lại danh sách đã chuẩn hóa. */
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

/** Mục "Bạn mê gì?" ở Cài đặt: sở thích lưu THEO DANH TÍNH (sang máy khác vẫn còn), dùng để gợi ý về sau. Chưa có danh tính thì nói rõ cách có. */
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
