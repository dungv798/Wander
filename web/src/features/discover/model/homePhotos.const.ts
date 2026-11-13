/** Photos chosen specifically for the card, keeping the subject when cropped horizontally; the banner photo is not reused. */
export const HOME_PHOTOS: Readonly<Record<string, { readonly file: string; readonly position: string }>> = {
  'buon-ma-thuot': { file: 'ref-buon-ma-thuot-thac-dray-sap-4-w1280-ec0f2b7ec5.webp', position: '40% 55%' },
  'can-tho': { file: 'pexels-32607908-w1280-84cc6d2226.webp', position: '50% 50%' },
  'cao-bang': { file: 'cao-bang-thac-ban-gioc-1-w1280-60e6822f02.webp', position: '50% 50%' },
  'da-lat': { file: 'thung-lung-tinh-yeu-1-w1280-5d194af31a.webp', position: '50% 60%' },
  'da-nang': { file: 'cau-rong-2-w1280-5b6ace626a.webp', position: '50% 60%' },
  'ha-giang': { file: 'deo-ma-pi-leng-1-w800-5b0f3e9770.webp', position: '50% 40%' },
  'ha-long': { file: 'ha-long-vinh-ha-long-3-w1024-fe1e2a34b4.webp', position: '50% 55%' },
  'ha-noi': { file: 'nha-hat-lon-ha-noi-2-w1280-c84c811909.webp', position: '50% 50%' },
  'ho-chi-minh': { file: 'nha-tho-duc-ba-1-w1280-7d41e9e8db.webp', position: '50% 30%' },
  'hoi-an': { file: 'pho-co-hoi-an-2-w1280-634bff5e33.webp', position: '50% 50%' },
  'hue': { file: 'cau-truong-tien-1-w1280-7e79d3c912.webp', position: '50% 60%' },
  'nha-trang': { file: 'hon-tam-1-w1280-e2a4c19863.webp', position: '50% 50%' },
  'ninh-binh': { file: 'ninh-binh-chua-bai-dinh-1-w1280-9e0ccbb2cd.webp', position: '50% 55%' },
  'phong-nha': { file: 'phong-nha-son-doong-1-w1280-4402820eaf.webp', position: '50% 45%' },
  'phu-quoc': { file: 'phu-quoc-bai-sao-1-w1280-faaf35264b.webp', position: '50% 50%' },
  'phu-yen': { file: 'ganh-da-dia-1-w1280-764f56b8b8.webp', position: '50% 65%' },
  'quy-nhon': { file: 'thap-duong-long-3-w1280-cac357f759.webp', position: '50% 55%' },
  'sa-pa': { file: 'sa-pa-ta-van-1-w1280-bd1ece248a.webp', position: '50% 60%' },
  'ta-xua': { file: 'ta-xua-4-w1280-58af14bdb1.webp', position: '50% 50%' },
  'vinh-hy': { file: 'vinh-vinh-hy-4-w1280-3cb89ab7c8.webp', position: '50% 55%' },
} as const;

/** The banner has its own photo, with a focal point for a low horizontal frame. */
export const HOME_BANNER = { file: 'ho-tuyen-lam-1-w1280-0c24449240.webp', position: '50% 65%' } as const;

/** A sharp landscape photo from the destination catalog itself, keeping the pine shore when cropped. */
export const HOME_MOOD_PHOTOS: Readonly<Record<string, Partial<Record<string, { readonly file: string; readonly position: string }>>>> = {
  'da-lat': { canh: { file: 'ho-xuan-huong-2-w1280-9d989b3de5.webp', position: '55% 65%' } },
};
