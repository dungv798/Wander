import { fill } from '../../../shared/const/copy.vi.ts';
import { cssVars } from '../../../shared/lib/cssVars.ts';
import { Icon } from '../../../shared/ui/Icon.tsx';
import { Button } from '../../../shared/ui/Button.tsx';
import type { OnboardCue } from '../hooks/useOnboardFlow.ts';
import { SCENES } from '../model/onboarding.const.ts';
import { ONBOARD_COPY as T } from '../model/onboarding.copy.ts';

interface OnboardNavProps {
  readonly scene: number;
  /** The sign that the scene is about to change by itself (null = none). */
  readonly cue: OnboardCue | null;
  readonly onGo: (to: number) => void;
}

/** The CSS class of one dot: it is at this scene, and (if about to change by itself) that dot fills up gradually in exactly the time that is left. */
function dotClass(active: boolean, cue: OnboardCue | null): string | undefined {
  const sweeping = active && cue !== null && cue.ms > 0;
  return [active ? 'on' : '', sweeping ? 'cue' : ''].filter(Boolean).join(' ') || undefined;
}

/** The bottom navigation: Back, four tappable dots (the current dot fills up when about to change by itself) and Next (nudges to hint at the next step). Always usable, never requiring the viewer to watch all the motion. */
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
