/** Ảnh chọn riêng cho thẻ, giữ chủ thể khi crop ngang; không dùng lại ảnh banner. */
export const HOME_PHOTOS: Readonly<Record<string, { readonly file: string; readonly position: string }>> = {
  'da-lat': { file: 'ho-xuan-huong-2-w1280-9d989b3de5.webp', position: '35% 65%' },
  'da-nang': { file: 'bai-bien-my-khe-2-w1280-b244125b7f.webp', position: '50% 65%' },
  'ha-giang': { file: 'hoang-su-phi-1-w800-01c5522837.webp', position: '45% 65%' },
  'ha-noi': { file: 'ho-hoan-kiem-2-w1280-84ba2bc74f.webp', position: '50% 65%' },
  'ho-chi-minh': { file: 'cho-ben-thanh-1-w1024-6d92d21be4.webp', position: '50% 60%' },
  'hoi-an': { file: 'pho-co-hoi-an-3-w1280-41960e88cf.webp', position: '50% 55%' },
  'hue': { file: 'hoang-thanh-hue-1-w1280-7d5636a653.webp', position: '50% 55%' },
  'nha-trang': { file: 'binh-ba-1-w1280-6295525c72.webp', position: '50% 70%' },
  'phu-yen': { file: 'ganh-da-dia-1-w1280-764f56b8b8.webp', position: '50% 65%' },
  'quy-nhon': { file: 'thap-banh-it-1-w1280-3dd04eb4cb.webp', position: '28% 45%' },
  'ta-xua': { file: 'ta-xua-1-w1280-e935c21120.webp', position: '55% 65%' },
  'vinh-hy': { file: 'vinh-vinh-hy-6-w1280-c4ae110fdd.webp', position: '60% 60%' },
} as const;

/** Banner có ảnh riêng, tiêu điểm dành cho khung ngang thấp. */
export const HOME_BANNER = { file: 'ho-tuyen-lam-1-w1280-0c24449240.webp', position: '50% 65%' } as const;

/** Ảnh cảnh quan rõ nét từ chính kho điểm đến, giữ bờ thông khi cắt ảnh. */
export const HOME_MOOD_PHOTOS: Readonly<Record<string, Partial<Record<string, { readonly file: string; readonly position: string }>>>> = {
  'da-lat': { canh: { file: 'ho-xuan-huong-2-w1280-9d989b3de5.webp', position: '55% 65%' } },
};
