import { VIEW } from '../../../shared/const/routes.const.ts';
import { replaceRoute } from '../../../shared/router/hashRoute.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { DestinationGate, useDestination } from '../../discover/index.ts';
import { useOnboarding } from '../hooks/OnboardingProvider.tsx';
import { ONBOARD_DESTINATION } from '../model/onboarding.const.ts';
import { ONBOARD_COPY as T } from '../model/onboarding.copy.ts';
import { OnboardStory } from './OnboardStory.tsx';

/** The first-time intro screen (`#/onboard`): loads the Da Lat destination then builds four scenes; if loading fails it still lets the user Skip into the app. */
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
