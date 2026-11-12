import { VIEW } from '../../../../shared/const/routes.const.ts';
import { navigate } from '../../../../shared/router/hashRoute.ts';
import { BrandMark } from '../../../../shared/ui/BrandMark.tsx';
import { HOME_COPY } from '../../model/home.copy.ts';
import { SearchBox } from './SearchBox.tsx';

/**
 * The compact top of the home page: the Wander mark + the destination name (if chosen, with a change button) then the search bar.
 * If no destination is chosen the title is only for screen readers (the hero right below is the visual focus).
 */
export function HomeHeader({ city }: { readonly city?: string }) {
  return <>
    <header className="nh-head">
      <BrandMark className="nh-brand" />
      {city ? (
        <div className="nh-title">
          <h1>{city}</h1>
          <button className="pill" type="button" onClick={() => navigate(VIEW.DESTINATIONS)}>{HOME_COPY.change}</button>
        </div>
      ) : <h1>{HOME_COPY.countryTitle}</h1>}
    </header>
    <SearchBox scope={city ? 'places' : 'destinations'} city={city} />
  </>;
}
