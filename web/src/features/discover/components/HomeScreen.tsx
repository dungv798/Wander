
import { MEDIA } from '../../../shared/const/app.const.ts';
import { useMediaQuery } from '../../../shared/hooks/useMediaQuery.ts';
import { DestinationGate } from './DestinationGate.tsx';
import { MoodSection, ResumeSection } from './home/HomeSections.tsx';
import { HeroWide } from './home/HeroWide.tsx';
import { HomeSky } from './home/HomeSky.tsx';
import { HomeMap } from './home/HomeMap.tsx';
import { useCurrentDestination } from '../hooks/CurrentDestinationProvider.tsx';
import { DestinationRail } from './home/DestinationRail.tsx';

/** Trang chủ gọn với ảnh thật, tiếp tục, mood và bản đồ tải khi cuộn tới. */
export function HomeScreen({ destId }: { readonly destId: string }) {
  const wide = useMediaQuery(MEDIA.WIDE);
  const { selectedId } = useCurrentDestination();
  if (!selectedId) return <DestinationRail national />;
  return (
    <DestinationGate destId={destId}>
      {dest => <>
        {wide ? <HeroWide dest={dest} /> : <HomeSky dest={dest} />}
        <div className="home-body pad-x">
          <ResumeSection dest={dest} />
          <MoodSection dest={dest} />
          <DestinationRail />
          <HomeMap dest={dest} />
        </div>
      </>}
    </DestinationGate>
  );
}
