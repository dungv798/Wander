import { useState } from 'react';
import type { ReactNode } from 'react';
import { COPY, fill } from '../../../shared/const/copy.vi.ts';
import { MEDIA } from '../../../shared/const/app.const.ts';
import { useMediaQuery } from '../../../shared/hooks/useMediaQuery.ts';
import { useReveal } from '../../../shared/hooks/useReveal.ts';
import { VIEW } from '../../../shared/const/routes.const.ts';
import { normalizeSearch } from '../../../shared/lib/text.ts';
import { navigate } from '../../../shared/router/hashRoute.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { EmptyState } from '../../../shared/ui/EmptyState.tsx';
import { useScreenFlag } from '../../../shared/ui/ScreenHost.tsx';
import { COMING_SOON } from '../model/discover.const.ts';
import type { DestinationDetail } from '../model/Catalog.types.ts';
import { DestinationGate } from './DestinationGate.tsx';
import { DestinationCardSection, FeaturedSection, MonthSection, MoodSection, ResumeSection, SoonSection, WallSection } from './home/HomeSections.tsx';
import { DestMapSection } from './map/DestMapSection.tsx';
import { HeroWide } from './home/HeroWide.tsx';
import { HomeSky } from './home/HomeSky.tsx';
import { Ribbon } from './home/Ribbon.tsx';
import { SearchBox } from './home/SearchBox.tsx';

/** Các khối bên dưới hero: khi không tìm thì đủ bộ gợi cảm hứng; khi tìm thì chỉ kết quả khớp. */
function HomeBody({ dest, query, wide, onClear, extra }: { readonly dest: DestinationDetail; readonly query: string; readonly wide: boolean; readonly onClear: () => void; readonly extra?: ReactNode }) {
  const n = normalizeSearch(query);
  const hit = !n || normalizeSearch(dest.name).includes(n);
  const soon = COMING_SOON.filter((o) => !n || normalizeSearch(o).includes(n));
  const ref = useReveal<HTMLDivElement>();
  if (!hit && !soon.length) {
    return (
      <div className={wide ? 'sections pad-x wsec' : 'sections pad-x'}>
        <EmptyState
          role="status"
          icon="compass"
          title={fill(COPY.home.noResultTitle, { q: query.trim() })}
          text={COPY.home.noResultText}
          actions={<Button kind="ghost" onClick={onClear}>{COPY.home.clearSearch}</Button>}
        />
      </div>
    );
  }
  return (
    <div ref={ref} className={wide ? 'sections pad-x wsec' : 'sections pad-x'}>
      {!n ? <ResumeSection dest={dest} /> : null}
      {hit && !n ? <MoodSection dest={dest} /> : null}
      {hit && !n ? <MonthSection dest={dest} /> : null}
      {hit && !n ? extra : null}
      {hit && wide && !n ? <WallSection dest={dest} /> : null}
      {hit && !n ? <DestMapSection dest={dest} /> : null}
      {hit ? <DestinationCardSection dest={dest} /> : null}
      {hit && n ? <FeaturedSection dest={dest} /> : null}
      <SoonSection names={soon} />
      {n ? null : <Button kind="ghost" block icon="key" onClick={() => navigate(VIEW.RECOVER)}>{COPY.home.openOnThisDevice}</Button>}
    </div>
  );
}

/** Màn Khám phá: hero (khác nhau theo cỡ màn), ô tìm kiếm rồi các khối gợi cảm hứng; đang tìm thì hero thu nhỏ để kết quả hiện ngay. */
export function HomeScreen({ destId, extra }: { readonly destId: string; /** Khối thêm do nơi ghép màn truyền vào (ví dụ "Lịch mẫu"), hiện sau "Nên đi tháng này". */ readonly extra?: ReactNode }) {
  const [query, setQuery] = useState('');
  const wide = useMediaQuery(MEDIA.WIDE);
  useScreenFlag('searching', normalizeSearch(query) !== '');
  return (
    <DestinationGate destId={destId}>
      {(dest) => (
        <>
          {wide ? <HeroWide dest={dest} query={query} onQuery={setQuery} /> : <HomeSky dest={dest} />}
          {wide ? null : <SearchBox value={query} onChange={setQuery} />}
          {wide ? null : <Ribbon dest={dest} />}
          <HomeBody dest={dest} query={query} wide={wide} onClear={() => setQuery('')} extra={extra} />
        </>
      )}
    </DestinationGate>
  );
}
