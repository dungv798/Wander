import { useEffect, useRef } from 'react';
import { VIEW } from '../../../shared/const/routes.const.ts';
import { usePrefersReducedMotion } from '../../../shared/hooks/useMediaQuery.ts';
import { cssVars } from '../../../shared/lib/cssVars.ts';
import { replaceRoute } from '../../../shared/router/hashRoute.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { BrandMark } from '../../../shared/ui/BrandMark.tsx';
import { Icon } from '../../../shared/ui/Icon.tsx';
import type { DestinationDetail } from '../../discover/index.ts';
import { useCardMorph } from '../hooks/useCardMorph.ts';
import { useOnboardFlow } from '../hooks/useOnboardFlow.ts';
import type { OnboardFlow } from '../hooks/useOnboardFlow.ts';
import { useOnboarding } from '../hooks/OnboardingProvider.tsx';
import { useSceneTransition } from '../hooks/useSceneTransition.ts';
import { SCENE } from '../model/onboarding.const.ts';
import { ONBOARD_COPY as T } from '../model/onboarding.copy.ts';
import type { SceneProps } from '../model/onboarding.types.ts';
import { DiscoverScene } from './DiscoverScene.tsx';
import { OnboardNav } from './OnboardNav.tsx';
import { PlanScene } from './PlanScene.tsx';
import { ShareScene } from './ShareScene.tsx';
import { SwipeScene } from './SwipeScene.tsx';

/** Chọn thành phần của cảnh theo chỉ số. */
function SceneView({ scene, ...props }: SceneProps & { readonly scene: number }) {
  if (scene === SCENE.SWIPE) return <SwipeScene {...props} />;
  if (scene === SCENE.PLAN) return <PlanScene {...props} />;
  if (scene === SCENE.SHARE) return <ShareScene {...props} />;
  return <DiscoverScene {...props} />;
}

/** Dấu thương hiệu chung, tên bước và lợi ích của cảnh; đổi cảnh chuyển focus vào tiêu đề để bàn phím không lạc vị trí. */
function SceneHeading({ scene, focus }: { readonly scene: number; readonly focus: boolean }) {
  const ref = useRef<HTMLHeadingElement | null>(null);
  useEffect(() => {
    if (focus) ref.current?.focus({ preventScroll: true });
  }, [focus, scene]);
  return (
    <>
      <BrandMark className="ob-wordmark" />
      <p className="ob-eyebrow">{T.sceneNames[scene]}</p>
      <h1 key={scene} ref={ref} tabIndex={-1} className="ob-title">
        {(T.titles[scene] ?? []).map((line) => (
          <span key={line}>{`${line} `}</span>
        ))}
      </h1>
      <p className="ob-description">{T.descriptions[scene]}</p>
    </>
  );
}

interface StageProps {
  readonly flow: OnboardFlow;
  readonly dest: DestinationDetail;
  readonly reduced: boolean;
}

/** Sân khấu các cảnh: cảnh cũ trượt ra, cảnh mới trượt vào cùng hướng người xem đi (Tiếp = sang trái, Quay lại = sang phải). Giữa cảnh 1 và cảnh 2 (cùng một thẻ ảnh) thì thẻ bay từ cảnh này sang cảnh kia còn phần còn lại mờ dần. Cảnh cũ bị khóa (không tự chuyển, không nhận chạm) cho tới khi biến mất. */
function Stage({ flow, dest, reduced }: StageProps) {
  const { prev, dir } = useSceneTransition(flow.scene, reduced);
  const stage = useRef<HTMLElement | null>(null);
  const shown = prev === null ? [flow.scene] : [prev, flow.scene];
  const sharedCard = prev !== null && Math.min(prev, flow.scene) === SCENE.DISCOVER && Math.max(prev, flow.scene) === SCENE.SWIPE;
  useCardMorph(stage, sharedCard, `${prev}-${flow.scene}`);
  return (
    <main ref={stage} className="ob-stage" data-dir={dir} data-kind={sharedCard ? 'morph' : undefined}>
      {shown.map((s) => {
        const current = s === flow.scene;
        return (
          <div key={s} className={`ob-layer ${current ? (prev === null ? 'in' : 'in enter') : 'out'}`} aria-hidden={current ? undefined : true} inert={current ? undefined : true}>
            <SceneView scene={s} dest={dest} reduced={reduced} auto={current && flow.auto} onDone={flow.advance} onInteract={flow.takeControl} onCue={flow.announce} />
          </div>
        );
      })}
    </main>
  );
}

/** Giới thiệu bốn bước trên cùng hệ vật liệu B; có demo tự chạy, điều hướng và giảm chuyển động, hoàn tất hoặc bỏ qua sẽ nhớ đã xem. */
export function OnboardStory({ dest }: { readonly dest: DestinationDetail }) {
  const { finish } = useOnboarding();
  const reduced = usePrefersReducedMotion();
  const flow = useOnboardFlow();
  /** Ghi nhận đã xem rồi về Khám phá (không đẩy lịch sử: Back không quay lại giới thiệu). */
  const done = (): void => {
    finish();
    replaceRoute(VIEW.EXPLORE);
  };
  const finished = flow.scene === SCENE.SHARE && flow.cue?.ms === 0;
  return (
    <section className="ob" data-scene={flow.scene} style={cssVars({ sc: flow.scene })}>
      <header className="ob-top">
        <SceneHeading scene={flow.scene} focus={flow.moved} />
        <Button kind="secondary" className="ob-skip" onClick={done}>
          {T.skip}
        </Button>
      </header>
      <Stage flow={flow} dest={dest} reduced={reduced} />
      <footer className="ob-bottom">
        {flow.scene === SCENE.SHARE ? (
          <Button block className={`ob-cta${finished ? ' cue-end' : ''}`} onClick={done}>
            {T.cta}
            <Icon name="chevron-left" className="flip" />
          </Button>
        ) : null}
        <OnboardNav scene={flow.scene} cue={flow.cue} onGo={flow.go} />
        <p className="ob-credit">{T.credit}</p>
      </footer>
    </section>
  );
}
