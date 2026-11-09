import { UI } from '../const/app.const.ts';
import { COPY } from '../const/copy.vi.ts';
import { useAfterDelay } from '../hooks/useAfterDelay.ts';

const SKELETON_BLOCKS = [{ height: 240 }, { height: 56 }, { height: 180 }] as const;

/** Khung xương khi đang tải màn đọc dữ liệu (`aria-busy`); tải quá `SLOW_LOAD_NOTICE_MS` thì thêm lời giải thích máy chủ đang thức dậy. */
export function ScreenSkeleton() {
  const slow = useAfterDelay(UI.SLOW_LOAD_NOTICE_MS);
  return (
    <div className="pad-x" aria-busy="true" aria-label={COPY.common.loading} style={{ paddingBlock: 24, display: 'grid', gap: 16 }}>
      {slow ? <p className="note" role="status">{COPY.common.slowLoad}</p> : null}
      {SKELETON_BLOCKS.map((b) => (
        <div key={b.height} className="skeleton" style={{ height: b.height }} />
      ))}
    </div>
  );
}
