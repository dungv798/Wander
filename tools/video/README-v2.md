# Hành trình và hero DR-031 — bản 2

Bản này thay phần kịch bản/kiểm tra cũ trong README.md; ghi công ảnh giữ nguyên ở README.md.

```powershell
node tools/video/record-journey.mjs
node tools/video/capture-hero-v2.mjs
node --import ./tools/video/redirect-check-log.mjs tools/look/check-initial-js.mjs
# Chạy trên máy có mạng để thay nền offline bằng tile thật:
node tools/video/record-journey.mjs --live
```

Không thêm dependency, không dùng ffmpeg. Chrome screencast từ hai tab app đã làm nóng đi vào cùng canvas/MediaRecorder VP8, 390×607 (xấp xỉ 9:14), 25 fps, ngân sách 2 MB. Tab riêng loại bỏ đoạn tải ảnh giữa các cảnh. Poster lấy từ thẻ ảnh thật sau decode và hiệu ứng vào trang; không lấy frame đang tải.

Mốc mục tiêu: ghim 0–1,5 s; chạm ghim/preview 1,5–3 s; bộ thẻ và vuốt phải 3–4,5 s; Ngày 1 và tuyến vẽ dần 4,5–6,5 s; ảnh lịch đã xuất sẵn và logo 6,5–8,1 s. Mốc thực tế và lỗi trang nằm trong `.logs/ux-video/v2/record.json`. Ảnh lịch cuối là chính ảnh xuất từ app đã làm nóng, không giả thao tác chia sẻ. Không quay nhánh Mời bạn.

Ghim dùng nguồn native: chỉ URL `entrance=stagger` mới đăng ký sự kiện `wander:pin-entrance`; script gửi sự kiện sau khi ảnh ghim sẵn sàng. Thêm feature lần lượt mỗi 240 ms, không thay API map và data-* cũ. Nhật ký `entranceSamples` là số feature **gửi vào nguồn**, không phải phép đếm pixel đã render. Luồng thường hiện đủ ngay; reduced-motion bỏ toàn bộ hiệu ứng. Đổi dữ liệu/hủy map hủy rAF.

NativeRoute dùng một đồng hồ rAF duy nhất, kẹp tiến độ và nội suy lần lượt từng đoạn trong 850 ms; hit source vẫn đầy đủ. Unit test bao phủ timestamp bắt đầu 0, tiến độ âm/quá hạn, đoạn giữa, hủy frame, reduced-motion và bất biến dữ liệu.

Hero video là khung điện thoại bo góc 9:14, với chữ/tìm kiếm/CTA ở khối sáng riêng bên dưới. Không có scrim trên clip; chỉ gradient nhẹ mép dưới. Chuyển điểm đến và pause/play nằm góc trên, nền kính đặc để giữ tương phản. Hero ảnh giữ nguyên khi video không được chọn/được phép hoặc gặp lỗi. Chỉ tải sau tương tác và idle; reduced-motion, saveData, dưới 360px giữ ảnh; tab ẩn dừng và giữ lựa chọn pause. `?hero=video` chỉ ép chọn, không vượt các điều kiện này.

`capture-hero-v2.mjs` là công cụ chụp/probe cục bộ, không chạy suite e2e: ba ảnh video đầu/giữa/cuối và một ảnh hero tĩnh ở 390×844, geometry không chồng chữ, tương phản pixel sau khi ẩn nét chữ, pause/visibility, reduced-motion, saveData, màn hẹp và lỗi media. Nhật ký trong `.logs/ux-video/v2/`. `web/e2e/herovideo.e2e.test.ts` được cập nhật nhưng không chạy theo chỉ thị. Home e2e ảnh cũ giữ selector và ý kiểm vì DOM fallback không đổi.

**Chưa bật mặc định:** `HERO_VIDEO.enabled=false`. Offline chỉ có nền bản đồ tối giản, không đường/tile địa lý; cảnh đầu vẫn dùng tổng quan chuyến, chưa phải cảnh bản đồ điểm đến thuần. Cần quay `--live` và duyệt lại hình ảnh trước khi bật. Chưa đo LCP/mạng chậm. Không coi lượt quay offline hoặc test logic là bằng chứng đạt chất lượng quảng cáo.

`redirect-check-log.mjs` chỉ chuyển đầu ra nhật ký của công cụ look sang vùng worker được sở hữu, giữ nguyên thuật toán tính JS/import tĩnh/modulepreload.
