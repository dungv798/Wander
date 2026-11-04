import { ART } from '../model/onboarding.const.ts';

/** Nền trời với bốn đám mây dựng sẵn (ảnh WebP nhỏ, tải lười); trang trí nên ẩn với trình đọc màn hình. */
export function Sky() {
  return (
    <div className="ob-sky" aria-hidden="true">
      {ART.CLOUDS.map((src, i) => (
        <img key={`cloud-${src}-${i}`} className={`ob-cloud c${i + 1}`} src={src} alt="" loading="lazy" decoding="async" />
      ))}
    </div>
  );
}
