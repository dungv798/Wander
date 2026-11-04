/** Ảnh chọn riêng cho thẻ, giữ chủ thể khi crop ngang; không dùng lại ảnh banner. */
export const HOME_PHOTOS: Readonly<Record<string, { readonly file: string; readonly position: string }>> = {
  'da-lat': { file: 'ho-xuan-huong-2.jpg', position: '35% 65%' },
  'da-nang': { file: 'bai-bien-my-khe-2.jpg', position: '50% 65%' },
  'ha-giang': { file: 'hoang-su-phi-1.jpg', position: '45% 65%' },
  'ha-noi': { file: 'ho-hoan-kiem-2.jpg', position: '50% 65%' },
  'ho-chi-minh': { file: 'cho-ben-thanh-1.jpg', position: '50% 60%' },
  'hoi-an': { file: 'pho-co-hoi-an-3.jpg', position: '50% 55%' },
  'hue': { file: 'hoang-thanh-hue-1.jpg', position: '50% 55%' },
  'nha-trang': { file: 'binh-ba-1.jpg', position: '50% 70%' },
  'phu-yen': { file: 'ganh-da-dia-1.jpg', position: '50% 65%' },
  'quy-nhon': { file: 'thap-banh-it-1.jpg', position: '28% 45%' },
  'ta-xua': { file: 'ta-xua-1.jpg', position: '55% 65%' },
  'vinh-hy': { file: 'vinh-vinh-hy-6.jpg', position: '60% 60%' },
} as const;

/** Banner có ảnh riêng, tiêu điểm dành cho khung ngang thấp. */
export const HOME_BANNER = { file: 'ho-tuyen-lam-1.jpg', position: '50% 65%' } as const;

/** Ảnh cảnh quan rõ nét từ chính kho điểm đến, giữ bờ thông khi cắt ảnh. */
export const HOME_MOOD_PHOTOS: Readonly<Record<string, Partial<Record<string, { readonly file: string; readonly position: string }>>>> = {
  'da-lat': { canh: { file: 'ho-xuan-huong-2.jpg', position: '55% 65%' } },
};
