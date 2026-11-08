import { fill } from '../../../shared/const/copy.vi.ts';
import { cssVars } from '../../../shared/lib/cssVars.ts';
import { Icon } from '../../../shared/ui/Icon.tsx';
import { Button } from '../../../shared/ui/Button.tsx';
import type { OnboardCue } from '../hooks/useOnboardFlow.ts';
import { SCENES } from '../model/onboarding.const.ts';
import { ONBOARD_COPY as T } from '../model/onboarding.copy.ts';

interface OnboardNavProps {
  readonly scene: number;
  /** Dấu hiệu sắp tự chuyển cảnh (null = không có). */
  readonly cue: OnboardCue | null;
  readonly onGo: (to: number) => void;
}

/** Lớp CSS của một chấm: đang ở cảnh này, và (nếu sắp tự chuyển) chấm đó chạy đầy dần đúng bằng thời gian còn lại. */
function dotClass(active: boolean, cue: OnboardCue | null): string | undefined {
  const sweeping = active && cue !== null && cue.ms > 0;
  return [active ? 'on' : '', sweeping ? 'cue' : ''].filter(Boolean).join(' ') || undefined;
}

/** Điều hướng dưới cùng: Quay lại, bốn chấm bấm được (chấm hiện tại chạy đầy khi sắp tự chuyển) và Tiếp (nhúc nhích nhắc bước kế). Luôn dùng được, không bắt xem hết chuyển động. */
export function OnboardNav({ scene, cue, onGo }: OnboardNavProps) {
  const last = scene === SCENES.length - 1;
  return (
    <nav className="ob-nav" aria-label={T.stepsLabel}>
      <Button kind="ghost" className="ob-navbtn ob-back" disabled={scene === 0} onClick={() => onGo(scene - 1)}>
        <Icon name="chevron-left" size="s" />
        {T.back}
      </Button>
      <div className="ob-dots">
        {SCENES.map((kind, i) => (
          <button key={kind} type="button" className={dotClass(i === scene, cue)} style={i === scene && cue ? cssVars({ cue: cue.ms }) : undefined} aria-label={fill(T.stepLabel, { n: i + 1, name: T.sceneNames[i] ?? '' })} aria-current={i === scene ? 'step' : undefined} onClick={() => onGo(i)} />
        ))}
      </div>
      <Button kind="secondary" className={`ob-navbtn ob-next${cue && cue.ms > 0 ? ' cue' : ''}`} style={last ? { visibility: 'hidden' } : undefined} disabled={last} onClick={() => onGo(scene + 1)}>
        {T.next}
        <Icon name="chevron-left" size="s" className="flip" />
      </Button>
    </nav>
  );
}
