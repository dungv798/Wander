/** Giới hạn nội dung và nhịp đổi ảnh trang chủ, tính bằng mili giây. */
export const HOME = { FEATURED_ID: 'ha-giang', OTHER_DESTINATIONS: 6, HERO_IMAGES: 4, ROTATE_MS: 6000, MOODS: 5, IMAGE_WIDTH: 1280, IMAGE_HEIGHT: 720, MAP_VISIBLE_RATIO: 0.5, MAP_ROOT_MARGIN: '0px 0px -112px 0px' } as const;
/** Chủ đề có dữ liệu POI thực để lọc; không tạo số lượng hoặc trải nghiệm giả. */
export const HOME_TOPICS = ['all', 'am', 'van', 'canh', 'leo'] as const;
/** Giữ nhịp các điểm đến của demo B trước, rồi bổ sung các vùng mới; không giấu bớt catalog. */
export const HOME_DESTINATION_ORDER = ['ha-giang', 'ta-xua', 'ha-noi', 'hoi-an', 'hue', 'da-nang', 'da-lat', 'nha-trang', 'quy-nhon', 'phu-yen', 'vinh-hy', 'ho-chi-minh', 'sa-pa', 'cao-bang', 'ninh-binh', 'ha-long', 'phong-nha', 'buon-ma-thuot', 'phu-quoc', 'can-tho'] as readonly string[];
