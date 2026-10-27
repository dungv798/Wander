import { useEffect, useRef, useState } from 'react';
import { fill } from '../../../shared/const/copy.vi.ts';
import { VIEW } from '../../../shared/const/routes.const.ts';
import { cssVars } from '../../../shared/lib/cssVars.ts';
import { replaceRoute } from '../../../shared/router/hashRoute.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { Icon } from '../../../shared/ui/Icon.tsx';
import { IconButton } from '../../../shared/ui/IconButton.tsx';
import { DestinationGate, placeById, useDestination } from '../../discover/index.ts';
import type { DestinationDetail, PlaceView } from '../../discover/index.ts';
import { useOnboarding } from '../hooks/OnboardingProvider.tsx';
import { ONBOARD_DESTINATION, ONBOARD_STEPS } from '../model/onboarding.const.ts';
import { ONBOARD_COPY as T } from '../model/onboarding.copy.ts';
import { InviteScene, PlanScene, SwipeScene } from './OnboardScenes.tsx';

/** Tiêu đề tách từng chữ để hiện lần lượt (chữ vẫn liền mạch với trình đọc màn hình). */
function Words({ text }: { readonly text: string }) {
  return (
    <>
      {text.split(' ').map((w, k) => (
        <span key={`${k}-${w}`}>
          <span className="w" style={cssVars({ w: k })}>{w}</span>{' '}
        </span>
      ))}
    </>
  );
}

/** Dòng ghi công ảnh: cảnh 1 nêu tác giả ảnh bìa; các cảnh sau chỉ về nơi xem nguồn từng ảnh. */
function creditOf(step: number, place: PlaceView | null): string {
  const photo = place?.photos[0];
  if (step !== 0 || !photo) return T.creditOthers;
  return fill(T.creditCover, { artist: photo.author }) + (photo.license ? fill(T.creditLicense, { license: photo.license }) : '');
}

/** Khối chữ của một cảnh: nhãn, tiêu đề (nhận focus khi đổi cảnh), lời mời, ghi công ảnh và nhãn "Bản nháp nội dung". */
function SceneText({ step, place, dest, focus }: { readonly step: number; readonly place: PlaceView | null; readonly dest: DestinationDetail; readonly focus: boolean }) {
  const copy = T.steps[step];
  const heading = useRef<HTMLHeadingElement | null>(null);
  useEffect(() => {
    if (focus) heading.current?.focus({ preventScroll: true });
  }, [focus, step]);
  if (!copy) return null;
  return (
    <div className="obx-text-wrap">
      <p className="obx-eyebrow">
        <Icon name="map-pin" size="s" />
        {copy.eyebrow || `${place?.name ?? ''}, ${dest.name}`}
      </p>
      <h1 ref={heading} tabIndex={-1}>
        <Words text={copy.title} />
      </h1>
      <p className="obx-text">{copy.text || place?.hook || ''}</p>
      <p className="obx-credit">
        {creditOf(step, place)} <span className="obx-draft">{T.draft}</span>
      </p>
    </div>
  );
}

/** Ba cảnh giới thiệu (S14): nền trời + minh họa tự chạy, thanh tiến độ, Quay lại/Bỏ qua/Tiếp. Xong hoặc bỏ qua thì nhớ "đã xem" và về Khám phá. */
function Onboard({ dest }: { readonly dest: DestinationDetail }) {
  const { finish } = useOnboarding();
  const [step, setStep] = useState(0);
  const [moved, setMoved] = useState(false);
  const last = step === ONBOARD_STEPS.length - 1;
  const def = ONBOARD_STEPS[step];
  const place = def ? placeById(dest, def.placeId) : null;
  /** Ghi nhận đã xem rồi về Khám phá. */
  const done = (): void => {
    finish();
    replaceRoute(VIEW.EXPLORE); // không đẩy lịch sử: nút Back không quay lại giới thiệu
  };
  /** Sang cảnh khác và cho tiêu đề mới nhận focus. */
  const go = (to: number): void => {
    setStep(to);
    setMoved(true);
  };
  return (
    <section className="obx" data-step={step}>
      <div className="obx-sky" aria-hidden="true">
        <div className="cloud c1" />
        <div className="cloud c2" />
        <div className="cloud c3" />
      </div>
      <div className="obx-top">
        {step > 0 ? <IconButton icon="chevron-left" label={T.back} className="glass" onClick={() => go(step - 1)} /> : <span className="obx-space" aria-hidden="true" />}
        <div className="obar obx-bar" role="progressbar" aria-valuemin={1} aria-valuemax={ONBOARD_STEPS.length} aria-valuenow={step + 1} aria-label={fill(T.progress, { n: step + 1, total: ONBOARD_STEPS.length })}>
          {ONBOARD_STEPS.map((s, i) => (
            <i key={s.scene} className={i <= step ? 'on' : undefined} />
          ))}
        </div>
        <button className="obx-skip" type="button" onClick={done}>
          {T.skip}
        </button>
      </div>
      <div className="obx-stage" aria-hidden="true">
        {def?.scene === 'invite' ? <InviteScene key="invite" dest={dest} place={place} /> : null}
        {def?.scene === 'swipe' ? <SwipeScene key="swipe" dest={dest} /> : null}
        {def?.scene === 'plan' ? <PlanScene key="plan" dest={dest} /> : null}
      </div>
      <div className="obx-body">
        <SceneText key={step} step={step} place={place} dest={dest} focus={moved} />
        <Button block className="obx-cta" onClick={last ? done : () => go(step + 1)}>
          {T.steps[step]?.cta}
        </Button>
      </div>
    </section>
  );
}

/** Màn giới thiệu lần đầu (`#/onboard`): tải điểm đến Hà Giang rồi dựng ba cảnh. */
export function OnboardScreen() {
  const { finish } = useOnboarding();
  const { state } = useDestination(ONBOARD_DESTINATION);
  return (
    <>
      <DestinationGate destId={ONBOARD_DESTINATION}>{(dest) => <Onboard dest={dest} />}</DestinationGate>
      {state.status === 'error' ? (
        <div className="stack pad-x">
          <Button
            kind="ghost"
            block
            onClick={() => {
              finish();
              replaceRoute(VIEW.EXPLORE);
            }}
          >
            {T.skip}
          </Button>
        </div>
      ) : null}
    </>
  );
}
