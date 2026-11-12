import { COPY } from '../const/copy.vi.ts';

const SKELETON_BLOCKS = [{ height: 240 }, { height: 56 }, { height: 180 }] as const;

/** Khung xương khi đang tải màn đọc dữ liệu (`aria-busy`). Lời giải thích máy chủ chậm do `SlowServerNotice` đảm nhiệm. */
export function ScreenSkeleton() {
  return (
    <div className="pad-x" aria-busy="true" aria-label={COPY.common.loading} style={{ paddingBlock: 24, display: 'grid', gap: 16 }}>
      {SKELETON_BLOCKS.map((b) => (
        <div key={b.height} className="skeleton" style={{ height: b.height }} />
      ))}
    </div>
  );
}
