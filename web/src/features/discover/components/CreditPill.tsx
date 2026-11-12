import { COPY, fill } from '../../../shared/const/copy.vi.ts';
import type { PhotoView } from '../model/Catalog.types.ts';
import { safeHttpUrl } from '../../../shared/lib/safeUrl.ts';

const AUTHOR_MAX_LENGTH = 28;

/** The photo-source label floating on the photo when the (i) button is tapped: the author, the license and the original photo link (attribution required by the license). */
export function CreditPill({ photo, fullAuthor = false }: { readonly photo: PhotoView | undefined; readonly fullAuthor?: boolean }) {
  if (!photo) return null;
  const name = photo.author || COPY.place.unknownAuthor;
  const author = fullAuthor ? name : name.slice(0, AUTHOR_MAX_LENGTH);
  return (
    <div className="credit-pill">
      {fill(COPY.place.photoCreditShort, { author, license: photo.license })}
      {' · '}
      <a href={safeHttpUrl(photo.sourceUrl)} target="_blank" rel="noopener noreferrer">
        {COPY.place.sourceOriginal}
      </a>
    </div>
  );
}
