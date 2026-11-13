/** Destinations whose banner is their approved Unsplash cover (the most recognisable view), not the first catalog photo below. */
export const HERO_COVER_FIRST: ReadonlySet<string> = new Set(['da-lat', 'ha-giang', 'ha-noi', 'ho-chi-minh', 'hoi-an', 'hue', 'nha-trang', 'quy-nhon', 'ta-xua']);

/** Hero photos per destination, picked by eye for a wide, low banner; the first one is the banner and the rest rotate in the hero. Every file is a photo of that destination's own places. */
export const HERO_PHOTOS: Readonly<Record<string, readonly string[]>> = {
  "buon-ma-thuot": [
    "ref-buon-ma-thuot-thac-dray-sap-3-w1280-eb1c8f26a1.webp",
    "buon-ma-thuot-thac-dray-nur-1-w1280-63041ccd54.webp",
    "buon-ma-thuot-ho-lak-1-w1024-2d326d66f2.webp"
  ],
  "can-tho": [
    "can-tho-cho-noi-cai-rang-1-w1280-031bb02028.webp",
    "supp-can-tho-truc-lam-phuong-nam-3-w1280-eca3ca8866.webp",
    "supp-can-tho-truc-lam-phuong-nam-1-w1280-8d1a4ce643.webp"
  ],
  "cao-bang": [
    "cao-bang-thac-ban-gioc-2-w1280-85f89c9191.webp",
    "pexels-6875004-w1280-c7ef234fe2.webp",
    "cao-bang-phia-oac-1-w1280-6c5942e7a7.webp"
  ],
  "da-lat": [
    "ho-tuyen-lam-1-w1280-0c24449240.webp",
    "ho-xuan-huong-2-w1280-9d989b3de5.webp",
    "lang-biang-1-w1280-eba7818b4d.webp",
    "thung-lung-tinh-yeu-1-w1280-5d194af31a.webp"
  ],
  "da-nang": [
    "cau-rong-1-w1280-50d05f482d.webp",
    "bai-bien-my-khe-2-w1280-b244125b7f.webp",
    "son-tra-1-w1024-905878f9ee.webp",
    "bai-bien-my-khe-1-w1280-c0d08d58e7.webp"
  ],
  "ha-giang": [
    "doc-tham-ma-2-w1280-27f84cecec.webp",
    "nui-co-tien-1-w1280-7505679fc5.webp",
    "cao-nguyen-da-4-w1280-359060bfca.webp",
    "doc-tham-ma-1-w1280-91da0e37f9.webp"
  ],
  "ha-long": [
    "ha-long-vinh-ha-long-2-w1280-792c72255c.webp",
    "ha-long-dao-ti-top-1-w1280-a307fba34c.webp",
    "ha-long-tuan-chau-1-w1280-417014b5de.webp",
    "ha-long-vinh-ha-long-1-w1280-8c806bf391.webp"
  ],
  "ha-noi": [
    "ho-tay-1-w1280-821f23ccc8.webp",
    "chua-tran-quoc-1-w1280-a61d1f9f0c.webp",
    "ho-hoan-kiem-1-w1280-c5d8672f8e.webp",
    "hoang-thanh-thang-long-3-w1280-7babe832f1.webp"
  ],
  "ho-chi-minh": [
    "pho-di-bo-nguyen-hue-2-w1280-a29cf73441.webp",
    "buu-dien-trung-tam-2-w1280-377ca43c4b.webp",
    "nha-hat-thanh-pho-1-w1280-cef3fb9164.webp",
    "rung-ngap-man-can-gio-1-w1024-67f137f87c.webp"
  ],
  "hoi-an": [
    "pho-co-hoi-an-1-w1280-37bee7f5cf.webp",
    "chua-cau-hoi-an-5-w1280-ef20c1e606.webp",
    "chua-cau-hoi-an-1-w1280-65183edcca.webp",
    "pho-co-hoi-an-5-w1280-646da0e3ff.webp"
  ],
  "hue": [
    "lang-minh-mang-1-w1280-5b301bf9ea.webp",
    "song-huong-2-w1280-772c816043.webp",
    "hoang-thanh-hue-1-w1280-7d5636a653.webp",
    "lang-khai-dinh-2-w1280-71c653843a.webp"
  ],
  "nha-trang": [
    "vinh-nha-trang-1-w1280-6b08c03a35.webp",
    "hon-tam-2-w1280-2ba8795276.webp",
    "binh-ba-1-w1280-6295525c72.webp",
    "supp-nha-trang-hon-chong-3-w1280-1a4875b0a9.webp"
  ],
  "ninh-binh": [
    "ninh-binh-tam-coc-2-w1280-f86eb2565c.webp",
    "ninh-binh-trang-an-1-w1280-13d7a0a705.webp",
    "ninh-binh-dong-am-tien-1-w1280-0267273ca3.webp",
    "ref-ninh-binh-dam-van-long-1-w1280-5dbcf5c292.webp"
  ],
  "phong-nha": [
    "phong-nha-vuon-quoc-gia-1-w1280-95236e566a.webp",
    "phong-nha-hang-en-1-w1280-7633a8696d.webp",
    "phong-nha-song-son-1-w1280-8ac3fe84fd.webp",
    "phong-nha-dong-phong-nha-1-w1280-92b763831d.webp"
  ],
  "phu-quoc": [
    "venue-fill-3baa9f122ddd614268-w1280-1b1ad7702d.webp",
    "venue-fill-c86dbef047cf06c1b0-w1280-1a9a61e737.webp",
    "venue-fill-07d3db04405b74bd8d-w1280-6bd4713297.webp"
  ],
  "phu-yen": [
    "phu-yen-vung-ro-1-w1280-d700a741de.webp",
    "mui-dien-1-w1280-b69bd2aae0.webp",
    "vinh-xuan-dai-2-w1280-ffdf250747.webp",
    "ref-phu-yen-bai-xep-2-w1280-a2dc60dddb.webp"
  ],
  "quy-nhon": [
    "thap-duong-long-2-w1280-fc4e571b52.webp",
    "ref-quy-nhon-eo-gio-1-w1280-4a65beb57c.webp",
    "dam-thi-nai-1-w1280-7c957b3514.webp",
    "thap-doi-1-w1280-6607675a5f.webp"
  ],
  "sa-pa": [
    "sapa-nui-ham-rong-1-w1146-eb8335a5d9.webp",
    "sa-pa-ta-phin-1-w1280-e21410a15e.webp",
    "wave-sa-pa-hoang-lien-2-w1280-26eb5a51af.webp",
    "sa-pa-thac-bac-1-w1280-073a8a9d44.webp"
  ],
  "ta-xua": [
    "ta-xua-1-w1280-e935c21120.webp",
    "ta-xua-5-w1280-d42dfdf2cd.webp"
  ],
  "vinh-hy": [
    "vinh-vinh-hy-5-w1280-915e0ac87a.webp",
    "vuon-quoc-gia-nui-chua-2-w1280-c258ba2c8f.webp",
    "vinh-vinh-hy-6-w1280-c4ae110fdd.webp",
    "hang-rai-1-w1280-6e0c134970.webp"
  ]
} as const;
