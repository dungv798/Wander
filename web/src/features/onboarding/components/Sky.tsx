import { ART } from '../model/onboarding.const.ts';

/** A sky background with four prebuilt clouds (small WebP images, lazy loaded); decorative so it is hidden from screen readers. */
export function Sky() {
  return (
    <div className="ob-sky" aria-hidden="true">
      {ART.CLOUDS.map((src, i) => (
        <img key={`cloud-${src}-${i}`} className={`ob-cloud c${i + 1}`} src={src} alt="" loading="lazy" decoding="async" />
      ))}
    </div>
  );
}
