# Chọn ảnh hero

Chạy offline: `node tools/look/analyze-hero.mjs`. Không thêm thư viện, không gọi mạng.
Chấm crop cover 390×448 bằng canvas: sáng trung bình sRGB, bão hòa HSV, tương phản (độ lệch chuẩn độ sáng), ổn định nửa dưới (1 − độ lệch chuẩn − chênh lệch pixel ngang). Đây là heuristic kỹ thuật, không thay thế thẩm định nội dung ảnh.

Loại sáng <0,32 hoặc >0,84; bão hòa <0,17; tương phản <0,12. Điểm = sáng×0,30 + bão hòa×0,30 + tương phản×0,15 + ổn định×0,25. Tối đa bốn ảnh, mỗi nơi một ảnh; không ảnh đạt thì FE giữ ảnh bìa. Chỉ dùng ảnh vẫn có trong API. Số liệu từng ảnh: .logs/look-real/hero/analysis.json.

- **da-lat**: ho-tuyen-lam-1.jpg, ho-xuan-huong-2.jpg, lang-biang-1.jpg, thung-lung-tinh-yeu-1.jpg; ưu tiên ảnh sáng, có sắc và vùng dưới ít biến động theo điểm trên.
- **da-nang**: bai-bien-my-khe-2.jpg, ba-na-2.jpg, deo-hai-van-1.jpg, cau-rong-1.jpg; ưu tiên ảnh sáng, có sắc và vùng dưới ít biến động theo điểm trên.
- **ha-giang**: hoang-su-phi-1.jpg, cao-nguyen-da-2.jpg, song-nho-que-4.jpg, cot-co-lung-cu-1.jpg; ưu tiên ảnh sáng, có sắc và vùng dưới ít biến động theo điểm trên.
- **ha-noi**: ho-hoan-kiem-2.jpg, chua-tran-quoc-1.jpg, lang-chu-tich-ho-chi-minh-1.jpg, hoang-thanh-thang-long-1.jpg; ưu tiên ảnh sáng, có sắc và vùng dưới ít biến động theo điểm trên.
- **ho-chi-minh**: chua-ngoc-hoang-1.jpg, rung-ngap-man-can-gio-1.jpg, cho-ben-thanh-1.jpg, dinh-doc-lap-2.jpg; ưu tiên ảnh sáng, có sắc và vùng dưới ít biến động theo điểm trên.
- **hoi-an**: pho-co-hoi-an-3.jpg, chua-cau-hoi-an-1.jpg, thanh-dia-my-son-1.jpg; ưu tiên ảnh sáng, có sắc và vùng dưới ít biến động theo điểm trên.
- **hue**: chua-thien-mu-1.jpg, hoang-thanh-hue-2.jpg, lang-co-2.jpg, lang-tu-duc-2.jpg; ưu tiên ảnh sáng, có sắc và vùng dưới ít biến động theo điểm trên.
- **nha-trang**: binh-ba-1.jpg, hon-tam-2.jpg, hon-tre-1.jpg, chua-long-son-2.jpg; ưu tiên ảnh sáng, có sắc và vùng dưới ít biến động theo điểm trên.
- **phu-yen**: thap-nhan-1.jpg, vinh-xuan-dai-1.jpg, dam-o-loan-1.jpg, ganh-da-dia-1.jpg; ưu tiên ảnh sáng, có sắc và vùng dưới ít biến động theo điểm trên.
- **quy-nhon**: thap-duong-long-2.jpg, thanh-do-ban-1.jpg, thap-banh-it-1.jpg, thap-canh-tien-1.jpg; ưu tiên ảnh sáng, có sắc và vùng dưới ít biến động theo điểm trên.
- **ta-xua**: ta-xua-1.jpg; ưu tiên ảnh sáng, có sắc và vùng dưới ít biến động theo điểm trên.
- **vinh-hy**: vuon-quoc-gia-nui-chua-2.jpg, thap-po-klong-garai-1.jpg, thap-hoa-lai-1.jpg, vinh-vinh-hy-1.jpg; ưu tiên ảnh sáng, có sắc và vùng dưới ít biến động theo điểm trên.
