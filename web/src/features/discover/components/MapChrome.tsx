import { COPY } from '../../../shared/const/copy.vi.ts';
import { VIEW } from '../../../shared/const/routes.const.ts';
import { navigate, useRoute } from '../../../shared/router/hashRoute.ts';
import { Icon } from '../../../shared/ui/Icon.tsx';
import { HOME_COPY } from '../model/home.copy.ts';
import { SearchBox } from './home/SearchBox.tsx';
import { useCurrentDestination } from '../hooks/CurrentDestinationProvider.tsx';
import type { ReactNode } from 'react';

/** Thanh tìm kiếm nằm trên bản đồ, độc lập với vùng cuộn của tờ nội dung như bản B. */
export function MapChrome({ children }: { readonly children?: ReactNode }) {
  const route = useRoute();
  const { destinations } = useCurrentDestination();
  const name = route.view === VIEW.DEST || route.view === VIEW.DECK ? destinations.find(destination => destination.id === route.id)?.name ?? HOME_COPY.country : HOME_COPY.country;
  return (
    <header className="map-chrome">
      <button className="map-chrome-brand" type="button" aria-label={COPY.brand.ariaHome} onClick={() => navigate(VIEW.EXPLORE)}>{COPY.brand.name}<span aria-hidden="true">·</span></button>
      <button className="map-chrome-scope" type="button" onClick={() => navigate(VIEW.DESTINATIONS)}><Icon name="map-pin" size="s" />{name}<Icon name="chevron-down" size="s" /></button>
      {children}
      <SearchBox />
    </header>
  );
}
