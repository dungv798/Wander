/** Đường dẫn API kho biên tập (khớp `CatalogApiConstants` của backend). */
export const CATALOG_API = {
  DESTINATIONS: '/api/catalog/destinations',
  QUERY_PARAM: 'q',
} as const;

/** Mã loại trong hợp đồng catalog; trường additive được kiểm trước khi dùng để lọc toàn quốc. */
export const CATALOG_CATEGORIES: readonly string[] = ['canh', 'van', 'am', 'leo', 'luu', 'cho'];
