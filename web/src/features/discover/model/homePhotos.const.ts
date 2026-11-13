/** The card photo per destination, keeping the subject when cropped horizontally. A `file` is a catalog photo; with no `file` the destination's approved Unsplash cover (`coverUrl`) is used and only the focal point is set here. */
export const HOME_PHOTOS: Readonly<Record<string, { readonly file?: string; readonly position: string }>> = {
  'buon-ma-thuot': { file: 'ref-buon-ma-thuot-thac-dray-sap-4-w1280-ec0f2b7ec5.webp', position: '40% 55%' },
  'can-tho': { file: 'pexels-32607908-w1280-84cc6d2226.webp', position: '50% 50%' },
  'cao-bang': { file: 'cao-bang-thac-ban-gioc-1-w1280-60e6822f02.webp', position: '50% 50%' },
  'da-lat': { position: '50% 55%' },
  'da-nang': { file: 'cau-rong-2-w1280-5b6ace626a.webp', position: '50% 60%' },
  'ha-giang': { file: 'deo-ma-pi-leng-1-w800-5b0f3e9770.webp', position: '50% 40%' },
  'ha-long': { file: 'ha-long-vinh-ha-long-3-w1024-fe1e2a34b4.webp', position: '50% 55%' },
  'ha-noi': { position: '50% 65%' },
  'ho-chi-minh': { position: '50% 50%' },
  'hoi-an': { position: '50% 60%' },
  'hue': { position: '50% 65%' },
  'nha-trang': { file: 'hon-tam-1-w1280-e2a4c19863.webp', position: '50% 50%' },
  'ninh-binh': { file: 'ninh-binh-tam-coc-2-w1280-f86eb2565c.webp', position: '40% 50%' },
  'phong-nha': { file: 'phong-nha-son-doong-1-w1280-4402820eaf.webp', position: '50% 45%' },
  'phu-quoc': { file: 'phu-quoc-bai-sao-1-w1280-faaf35264b.webp', position: '50% 50%' },
  'phu-yen': { file: 'ganh-da-dia-1-w1280-764f56b8b8.webp', position: '50% 65%' },
  'quy-nhon': { file: 'thap-duong-long-3-w1280-cac357f759.webp', position: '50% 55%' },
  'sa-pa': { file: 'sa-pa-ta-van-1-w1280-bd1ece248a.webp', position: '50% 60%' },
  'ta-xua': { position: '50% 60%' },
  'vinh-hy': { file: 'vinh-vinh-hy-4-w1280-3cb89ab7c8.webp', position: '50% 55%' },
} as const;

/** The banner has its own photo, with a focal point for a low horizontal frame. */
export const HOME_BANNER = { file: 'ho-tuyen-lam-1-w1280-0c24449240.webp', position: '50% 65%' } as const;

/** A sharp landscape photo from the destination catalog itself, keeping the pine shore when cropped. */
export const HOME_MOOD_PHOTOS: Readonly<Record<string, Partial<Record<string, { readonly file: string; readonly position: string }>>>> = {
  'da-lat': { canh: { file: 'ho-xuan-huong-2-w1280-9d989b3de5.webp', position: '55% 65%' } },
};
