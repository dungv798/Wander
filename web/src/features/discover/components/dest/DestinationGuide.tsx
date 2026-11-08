import { useState } from 'react';
import { fill } from '../../../../shared/const/copy.vi.ts';
import { Icon } from '../../../../shared/ui/Icon.tsx';
import { IconButton } from '../../../../shared/ui/IconButton.tsx';
import { Sheet } from '../../../../shared/ui/Sheet.tsx';
import { COPY } from '../../../../shared/const/copy.vi.ts';
import { useDiscover } from '../../hooks/DiscoverProvider.tsx';
import type { DestinationDetail } from '../../model/Catalog.types.ts';
import { GuideSections } from './GuideSections.tsx';

/** Lối vào cẩm nang luôn ở đầu điểm đến; món ăn không còn bị chôn sau hàng chục thẻ. */
export function DestinationGuide({ dest }: { readonly dest: DestinationDetail }) {
  const [opened, setOpened] = useState(false);
  const { state, actions } = useDiscover();
  const title = fill(COPY.dest.guideTitle, { dest: dest.name });
  return <>
    <button className="dest-guide" type="button" aria-label={title} onClick={() => { setOpened(true); if (!state.guide && dest.guide[0]) actions.toggleGuide(dest.guide[0].id); }}><Icon name="compass" /></button>
    {opened ? <Sheet label={title} onClose={() => setOpened(false)}>
      <div className="pp destination-guide-content"><header><h2>{title}</h2><IconButton icon="x" label={COPY.common.close} onClick={() => setOpened(false)} /></header><GuideSections dest={dest} /></div>
    </Sheet> : null}
  </>;
}
