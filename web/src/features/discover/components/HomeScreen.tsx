
import { DestinationGate } from './DestinationGate.tsx';
import { MoodSection, ResumeSection } from './home/HomeSections.tsx';
import { HomeMap } from './home/HomeMap.tsx';
import { useCurrentDestination } from '../hooks/CurrentDestinationProvider.tsx';
import { DestinationRail } from './home/DestinationRail.tsx';
import { NationalHome } from './home/NationalHome.tsx';
import { HomeHeader } from './home/HomeHeader.tsx';
import { HomeBanner } from './home/HomeBanner.tsx';
import { MomentsSection } from './MomentsSection.tsx';

/** Trang chủ gọn với ảnh thật, tiếp tục, mood và bản đồ tải khi cuộn tới. */
export function HomeScreen({ destId }: { readonly destId: string }) {
  const { selectedId } = useCurrentDestination();
  if (!selectedId) return <NationalHome />;
  return (
    <DestinationGate destId={destId}>
      {dest => <div className="national-home home-selected pad-x">
        <HomeHeader city={dest.name} />
        <ResumeSection dest={dest} />
        <HomeBanner dest={dest} />
        <div className="home-body">
          <MoodSection dest={dest} />
          <MomentsSection key={dest.id} dest={dest} />
          <DestinationRail />
          <HomeMap dest={dest} />
        </div>
      </div>}
    </DestinationGate>
  );
}
