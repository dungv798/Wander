/** Paths of the editorial catalog API (matching the backend's `CatalogApiConstants`). */
export const CATALOG_API = {
  DESTINATIONS: '/api/catalog/destinations',
  QUERY_PARAM: 'q',
} as const;

/** The kind code in the catalog contract; the additive field is checked before it is used to filter nationwide. */
export const CATALOG_CATEGORIES: readonly string[] = ['canh', 'van', 'am', 'leo', 'luu', 'cho'];
