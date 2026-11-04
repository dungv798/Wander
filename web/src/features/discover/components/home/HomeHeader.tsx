import { COPY } from '../../../../shared/const/copy.vi.ts';
import { VIEW } from '../../../../shared/const/routes.const.ts';
import { navigate } from '../../../../shared/router/hashRoute.ts';
import { Icon } from '../../../../shared/ui/Icon.tsx';
import { HOME_COPY } from '../../model/home.copy.ts';
import { SearchBox } from './SearchBox.tsx';

/** Chung thương hiệu và phân cấp tiêu đề cho hai trạng thái; tìm địa điểm khi đã có thành phố. */
export function HomeHeader({ city }: { readonly city?: string }) {
  return <>
    <header className="nh-head">
      <p className="nh-brand"><Icon name="compass" /><span>{COPY.brand.name}</span></p>
      <div className="nh-title">
        <h1>{city ?? COPY.destinations.title}</h1>
        {city ? <button className="pill" type="button" onClick={() => navigate(VIEW.DESTINATIONS)}>{HOME_COPY.change}</button> : null}
      </div>
    </header>
    <SearchBox scope={city ? 'places' : 'destinations'} city={city} />
  </>;
}
