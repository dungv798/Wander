import { useCallback, useMemo, useState } from 'react';
import { useLatestRef } from '../../../shared/hooks/useLatestRef.ts';
import { SCENES } from '../model/onboarding.const.ts';

/** Dấu hiệu "sắp chuyển cảnh" trên chấm tiến độ của cảnh `scene` (ms = thời gian còn lại; 0 ở cảnh cuối = đã kể xong). */
export interface OnboardCue {
  readonly scene: number;
  readonly ms: number;
}

/** Điều khiển luồng bốn cảnh: cảnh hiện tại, còn tự chuyển không, và đã có thao tác của người xem chưa (để dời tiêu điểm tới tiêu đề mới). */
export interface OnboardFlow {
  readonly scene: number;
  readonly auto: boolean;
  readonly moved: boolean;
  /** Dấu hiệu sắp chuyển cảnh (chỉ khi còn tự chạy). */
  readonly cue: OnboardCue | null;
  /** Báo sắp chuyển cảnh sau `ms` mili-giây. */
  readonly announce: (ms: number) => void;
  /** Người xem chọn cảnh (nút Tiếp/Quay lại/chấm): dừng tự chuyển. */
  readonly go: (to: number) => void;
  /** Cảnh vừa xong và tự chuyển sang cảnh kế (chỉ khi còn ở chế độ tự chạy). */
  readonly advance: () => void;
  /** Người xem chạm vào nội dung cảnh: từ nay không tự chuyển nữa. */
  readonly takeControl: () => void;
}

/** Giữ chỉ số cảnh trong khoảng hợp lệ. */
function clampScene(n: number): number {
  return Math.max(0, Math.min(SCENES.length - 1, n));
}

/** Trạng thái luồng giới thiệu: tự chạy theo từng cảnh cho tới khi người xem tự điều khiển. */
export function useOnboardFlow(): OnboardFlow {
  const [scene, setScene] = useState(0);
  const [auto, setAuto] = useState(true);
  const [moved, setMoved] = useState(false);
  const [cue, setCue] = useState<OnboardCue | null>(null);
  const sceneRef = useLatestRef(scene);
  const announce = useCallback((ms: number) => setCue({ scene: sceneRef.current, ms }), [sceneRef]);
  const go = useCallback((to: number) => {
    setAuto(false);
    setCue(null);
    setMoved(true);
    setScene(clampScene(to));
  }, []);
  const advance = useCallback(() => {
    setCue(null);
    setMoved(true);
    setScene((s) => clampScene(s + 1));
  }, []);
  const takeControl = useCallback(() => {
    setAuto(false);
    setCue(null);
  }, []);
  const visible = auto && cue?.scene === scene ? cue : null;
  return useMemo(() => ({ scene, auto, moved, cue: visible, announce, go, advance, takeControl }), [scene, auto, moved, visible, announce, go, advance, takeControl]);
}
