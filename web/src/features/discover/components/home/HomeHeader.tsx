import { VIEW } from '../../../../shared/const/routes.const.ts';
import { navigate } from '../../../../shared/router/hashRoute.ts';
import { BrandMark } from '../../../../shared/ui/BrandMark.tsx';
import { HOME_COPY } from '../../model/home.copy.ts';
import { SearchBox } from './SearchBox.tsx';

/**
 * Đầu trang chủ gọn: dấu Wander + tên điểm đến (nếu đã chọn, kèm nút đổi) rồi thanh tìm.
 * Chưa chọn điểm đến thì tiêu đề chỉ dành cho trình đọc màn hình (hero ngay dưới mới là tiêu điểm thị giác).
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
