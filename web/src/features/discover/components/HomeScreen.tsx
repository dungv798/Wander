import type { ReactNode } from 'react';
import { MEDIA } from '../../../shared/const/app.const.ts';
import { useMediaQuery } from '../../../shared/hooks/useMediaQuery.ts';
import { DestinationGate } from './DestinationGate.tsx';
import { MoodSection, ResumeSection } from './home/HomeSections.tsx';
import { HeroWide } from './home/HeroWide.tsx';
import { HomeSky } from './home/HomeSky.tsx';
import { HomeMap } from './home/HomeMap.tsx';

/** Trang chủ gọn với ảnh thật, tiếp tục, mood và bản đồ tải khi cuộn tới. */
export function HomeScreen({ destId, extra }: { readonly destId: string; readonly extra?: ReactNode }) {
  const wide = useMediaQuery(MEDIA.WIDE);
  return (
    <DestinationGate destId={destId}>
      {dest => <>
        {wide ? <HeroWide dest={dest} /> : <HomeSky dest={dest} />}
        <div className="home-body pad-x">
          <ResumeSection dest={dest} />
          <MoodSection dest={dest} />
          <HomeMap dest={dest} />
          {extra}
        </div>
      </>}
    </DestinationGate>
  );
}
