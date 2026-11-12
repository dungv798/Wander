import { Button } from '../../../shared/ui/Button.tsx';
import { WarnBox } from '../../../shared/ui/Controls.tsx';
import { Icon } from '../../../shared/ui/Icon.tsx';
import { Sheet } from '../../../shared/ui/Sheet.tsx';
import { IDENTITY_COPY as C } from '../model/identity.copy.ts';

interface IntroProps {
  /** The user chose to create an identity and get a code. */
  readonly onCreate: () => void;
  /** The user chose 'Later': saves the trip without a code yet. */
  readonly onLater: () => void;
  /** There is an old identity that can no longer be recovered: shows a warning that the old trips are lost for good. */
  readonly replacing?: boolean;
  /** Closes without creating anything (Esc, tapping the background or Cancel). */
  readonly onClose: () => void;
}

/** The explanation sheet at the first save (S9): the anonymous identity in everyday words, the code shown once, ONE light warning line under the 'Later' button. */
export function IntroSheet({ onCreate, onLater, replacing = false, onClose }: IntroProps) {
  return (
    <Sheet label={C.intro.title} onClose={onClose}>
      <div className="pp">
        <div>
          <h2>{C.intro.title}</h2>
          <p className="note spaced">{C.intro.text}</p>
        </div>
        {replacing ? <WarnBox>{C.intro.replaceWarn}</WarnBox> : null}
        <ul className="keybox">
          <li>
            <Icon name="key" />
            <span>{C.intro.key}</span>
          </li>
        </ul>
        <div className="stack">
          <Button block onClick={onCreate}>
            {C.intro.create}
          </Button>
          <Button kind="ghost" block onClick={onLater}>
            {C.intro.later}
          </Button>
          <p className="note skipnote">
            <Icon name="info-circle" size="s" />
            {C.intro.skipNote}
          </p>
          <Button kind="ghost" block onClick={onClose}>
            {C.intro.cancel}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
