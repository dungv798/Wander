import { COPY, fill } from '../../../../shared/const/copy.vi.ts';
import { cssVars } from '../../../../shared/lib/cssVars.ts';
import { Compass, Plane, Sun } from '../../../../shared/ui/art/Art.tsx';
import { Icon } from '../../../../shared/ui/Icon.tsx';
import { HOME_PLACES, HOME_PREVIEW } from '../../model/discover.const.ts';
import type { DestinationDetail } from '../../model/Catalog.types.ts';
import { firstPhotoUrl, placeById } from '../../model/destinationQueries.ts';

interface HomeSkyProps {
  readonly dest: DestinationDetail;
}

/** Câu mời đổi luân phiên dưới logo; trình đọc màn hình chỉ đọc câu đầu, các câu sau chỉ trang trí. */
function HookRotator({ dest }: HomeSkyProps) {
  /** Thay tên điểm đến hiện tại vào câu mời dùng chung. */
  const say = (h: string): string => fill(h, { dest: dest.name });
  const hooks = COPY.home.hooks;
  return (
    <div className="tagline" role="img" aria-label={say(hooks[0])}>
      {hooks.map((h, k) => (
        <span key={h} aria-hidden="true" style={cssVars({ n: k })}>
          {say(h)}
        </span>
      ))}
    </div>
  );
}

/** Thẻ giữa của quạt: ảnh các nơi chạy luân phiên, tên đổi theo ảnh, dấu "thích" nảy lên như vừa quẹt phải. */
function LiveCard({ dest }: HomeSkyProps) {
  const ids = dest.places.slice(0, HOME_PREVIEW.LIVE).map((place) => place.id);
  return (
    <figure className="f2 live">
      {ids.map((id, k) => (
        <img key={id} alt="" src={firstPhotoUrl(placeById(dest, id))} style={cssVars({ n: k })} />
      ))}
      <i />
      {ids.map((id, k) => (
        <span key={id} style={cssVars({ n: k })}>
          {placeById(dest, id)?.name}
        </span>
      ))}
      <em className="live-ok" aria-hidden="true">
        <Icon name="check" />
      </em>
    </figure>
  );
}

/** Một ảnh nghiêng của quạt (thẻ trái/phải). */
function FanCard({ dest, id, cls }: HomeSkyProps & { readonly id: string; readonly cls: string }) {
  const p = placeById(dest, id);
  return (
    <figure className={cls}>
      <img alt="" src={firstPhotoUrl(p)} />
      <i />
      <span>{p?.name}</span>
    </figure>
  );
}

/** Hero trang chủ điện thoại: trời có mặt trời, mây trôi, máy bay lướt, quạt ảnh, ghim nổi, la bàn (v6, PO 26/10/2026). */
export function HomeSky({ dest }: HomeSkyProps) {
  const left = dest.places[0]?.id ?? '';
  const right = dest.places[HOME_PREVIEW.RIGHT]?.id ?? left;
  return (
    <section className="sky">
      <div className="sky-sun">
        <Sun />
      </div>
      <div className="cloud c1" />
      <div className="cloud c2" />
      <div className="cloud c3" />
      <h1 className="logo">{COPY.brand.name}</h1>
      <HookRotator dest={dest} />
      {HOME_PLACES.PINS.map((pin, index) => ({ ...pin, id: dest.places[index]?.id ?? left })).map((x) => (
        <span key={x.id} className={`pin ${x.cls}`}>
          <Icon name="map-pin" size="s" />
          {placeById(dest, x.id)?.name}
        </span>
      ))}
      <Plane />
      <div className="fan">
        <FanCard dest={dest} id={left} cls="f1" />
        <LiveCard dest={dest} />
        <FanCard dest={dest} id={right} cls="f3" />
      </div>
      <Compass />
    </section>
  );
}
