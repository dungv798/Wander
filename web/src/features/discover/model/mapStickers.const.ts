import type { CategoryCode } from './Catalog.types.ts';

/** The same icon set as the place kinds; used only for destinations that really exist in the catalog. */
export const DESTINATION_STICKERS: Readonly<Record<string, CategoryCode>> = {
  'ha-giang': 'leo', 'ta-xua': 'leo', 'sa-pa': 'leo', 'cao-bang': 'canh',
  'ha-noi': 'van', 'ho-chi-minh': 'van', 'hoi-an': 'van', hue: 'van',
  'da-lat': 'canh', 'da-nang': 'canh', 'nha-trang': 'canh', 'phu-yen': 'canh',
  'quy-nhon': 'canh', 'vinh-hy': 'canh', 'ninh-binh': 'canh', 'ha-long': 'canh',
  'phong-nha': 'canh', 'buon-ma-thuot': 'canh', 'phu-quoc': 'canh', 'can-tho': 'cho',
};
