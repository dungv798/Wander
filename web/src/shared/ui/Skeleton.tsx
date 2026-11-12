import { COPY } from '../const/copy.vi.ts';

const SKELETON_BLOCKS = [{ height: 240 }, { height: 56 }, { height: 180 }] as const;

/** A skeleton while a screen that reads data is loading (`aria-busy`). The slow-server explanation is handled by `SlowServerNotice`. */
export function ScreenSkeleton() {
  return (
    <div className="pad-x" aria-busy="true" aria-label={COPY.common.loading} style={{ paddingBlock: 24, display: 'grid', gap: 16 }}>
      {SKELETON_BLOCKS.map((b) => (
        <div key={b.height} className="skeleton" style={{ height: b.height }} />
      ))}
    </div>
  );
}
