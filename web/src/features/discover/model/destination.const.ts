/** Thời gian chờ ngừng gõ trước khi bay camera, mili giây. */
export const DESTINATION_SEARCH_DEBOUNCE_MS = 1000;
/** Khóa lựa chọn điểm đến công khai, không chứa bí mật. */
export const DESTINATION_STORAGE_KEY = 'wander.web.destination.v1';
/** Trần zoom khi tìm tâm điểm đến. */
export const DESTINATION_SEARCH_ZOOM = 10;
/** Mã nền toàn quốc cho bộ bản đồ dùng chung. */
export const COUNTRY_MAP_ID = 'vietnam';
/** Cùng dạng mã tuyến: chữ thường, số, gạch ngang; tối đa 64 ký tự. */
export const DESTINATION_ID_PATTERN = /^[a-z0-9-]{1,64}$/;
