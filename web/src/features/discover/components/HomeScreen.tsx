import type { ReactNode } from 'react';
import { COPY } from '../../../shared/const/copy.vi.ts';
import { MEDIA } from '../../../shared/const/app.const.ts';
import { useMediaQuery } from '../../../shared/hooks/useMediaQuery.ts';
import { useReveal } from '../../../shared/hooks/useReveal.ts';
import { VIEW } from '../../../shared/const/routes.const.ts';
import { navigate } from '../../../shared/router/hashRoute.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import type { DestinationDetail } from '../model/Catalog.types.ts';
import { DestinationGate } from './DestinationGate.tsx';
import { DestinationCardSection, MonthSection, MoodSection, ResumeSection, WallSection } from './home/HomeSections.tsx';
import { DestMapSection } from './map/DestMapSection.tsx';
import { HeroWide } from './home/HeroWide.tsx';
import { HomeSky } from './home/HomeSky.tsx';
import { Ribbon } from './home/Ribbon.tsx';
import { SearchBox } from './home/SearchBox.tsx';

/** Các khối cảm hứng lấy hoàn toàn từ điểm đến hiện tại. */
function HomeBody({ dest, wide, extra }: { readonly dest: DestinationDetail; readonly wide: boolean; readonly extra?: ReactNode }) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={wide ? 'sections pad-x wsec' : 'sections pad-x'}>
      <ResumeSection dest={dest} />
      <MoodSection dest={dest} />
      <MonthSection dest={dest} />
      {extra}
      {wide ? <WallSection dest={dest} /> : null}
      <DestMapSection dest={dest} />
      <DestinationCardSection dest={dest} />
      <Button kind="ghost" block icon="key" onClick={() => navigate(VIEW.RECOVER)}>{COPY.home.openOnThisDevice}</Button>
    </div>
  );
}

/** Trang chủ theo điểm đến hiện tại; nút tìm mở màn chọn toàn màn. */
export function HomeScreen({ destId, extra }: { readonly destId: string; readonly extra?: ReactNode }) {
  const wide = useMediaQuery(MEDIA.WIDE);
  return (
    <DestinationGate destId={destId}>
      {(dest) => (
        <>
          {wide ? <HeroWide dest={dest} /> : <HomeSky dest={dest} />}
          {wide ? null : <SearchBox />}
          {wide ? null : <Ribbon dest={dest} />}
          <HomeBody dest={dest} wide={wide} extra={extra} />
        </>
      )}
    </DestinationGate>
  );
}
