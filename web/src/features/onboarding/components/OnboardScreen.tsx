import { VIEW } from '../../../shared/const/routes.const.ts';
import { replaceRoute } from '../../../shared/router/hashRoute.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { DestinationGate, useDestination } from '../../discover/index.ts';
import { useOnboarding } from '../hooks/OnboardingProvider.tsx';
import { ONBOARD_DESTINATION } from '../model/onboarding.const.ts';
import { ONBOARD_COPY as T } from '../model/onboarding.copy.ts';
import { OnboardStory } from './OnboardStory.tsx';

/** Màn giới thiệu lần đầu (`#/onboard`): tải điểm đến Đà Lạt rồi dựng bốn cảnh; nếu tải lỗi vẫn cho Bỏ qua để vào app. */
export function OnboardScreen() {
  const { finish } = useOnboarding();
  const { state } = useDestination(ONBOARD_DESTINATION);
  return (
    <>
      <DestinationGate destId={ONBOARD_DESTINATION}>{(dest) => <OnboardStory dest={dest} />}</DestinationGate>
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
