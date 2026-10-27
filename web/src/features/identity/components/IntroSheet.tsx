import { Button } from '../../../shared/ui/Button.tsx';
import { WarnBox } from '../../../shared/ui/Controls.tsx';
import { Icon } from '../../../shared/ui/Icon.tsx';
import { Sheet } from '../../../shared/ui/Sheet.tsx';
import { IDENTITY_COPY as C } from '../model/identity.copy.ts';

interface IntroProps {
  /** Người dùng chọn tạo danh tính và nhận mã. */
  readonly onCreate: () => void;
  /** Người dùng chọn "Để sau": lưu chuyến đi mà chưa có mã. */
  readonly onLater: () => void;
  /** Có danh tính cũ không còn khôi phục được: hiện cảnh báo chuyến cũ mất vĩnh viễn. */
  readonly replacing?: boolean;
  /** Đóng mà không tạo gì (Esc, chạm nền hoặc Hủy). */
  readonly onClose: () => void;
}

/** Tờ giải thích khi lưu lần đầu (S9): danh tính ẩn danh bằng chữ thường ngày, mã hiện một lần, MỘT dòng cảnh báo nhẹ dưới nút "Để sau". */
export function IntroSheet({ onCreate, onLater, replacing = false, onClose }: IntroProps) {
  return (
    <Sheet label={C.intro.title} onClose={onClose}>
      <div className="pp">
        <div>
          <h2>{C.intro.title}</h2>
          <p className="note spaced">{C.intro.text}</p>
        </div>
        {replacing ? <WarnBox>{C.intro.replaceWarn}</WarnBox> : null}
        <ul className="keybox">
          <li>
            <Icon name="key" />
            <span>{C.intro.key}</span>
          </li>
        </ul>
        <div className="stack">
          <Button block onClick={onCreate}>
            {C.intro.create}
          </Button>
          <Button kind="ghost" block onClick={onLater}>
            {C.intro.later}
          </Button>
          <p className="note skipnote">
            <Icon name="info-circle" size="s" />
            {C.intro.skipNote}
          </p>
          <Button kind="ghost" block onClick={onClose}>
            {C.intro.cancel}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
