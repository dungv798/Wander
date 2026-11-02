# TVC Wander (vertical 9:16, 24 s)

Bản hiện hành: **composition4.html** ("Liquid Glass Sunset": nền bình minh chảy theo cảnh, chuyển cảnh chất lỏng bằng shader, chip kính mờ, sticker du lịch tự vẽ SVG, điện thoại 3D với ảnh chụp màn hình thật). composition.html (2D) và composition3d.html là các bản trước.

Dựng xác định từng khung hình (không quay thời gian thực nên không giật, không mờ) bằng Chrome + Three.js (MIT, chỉ là công cụ dựng, không vào bundle của app).

```powershell
cd tools/tvc; npm install                       # three@0.170 (devDependency)
node tools/tvc/capture-screens.mjs              # chụp màn hình THẬT của app (390×844, 3×, tile bản đồ thật, cần mạng)
$env:COMP='composition4.html'                    # bản hiện hành
node tools/tvc/capture-live.mjs                 # (cần backend ở 8787) thêm nhiều nơi, quán gần, thẻ đánh giá
node tools/tvc/capture-live-extra.mjs           # trạng thái chưa tích của Thêm nhiều nơi
node tools/tvc/render.mjs preview 1.5,8.2,12.8  # ảnh xem thử
node tools/tvc/render.mjs frames                # 720 khung PNG 1080×1920
node tools/tvc/encode.mjs master                # out/wander-tvc.webm  (1080×1920, ~26 MB)
$env:HERO_BITRATE='700000'; node tools/tvc/encode.mjs hero   # out/wander-hero.webm (720×1120, 9:14, ~2 MB)
```

Hero: chép `out/wander-hero.webm` thành `web/public/video/journey.webm`, poster lấy từ khung 2,3 s (`out/frames/f00069.png`, cắt 9:14). Giữ chữ trong vùng an toàn: tránh nút chọn điểm đến và nút tạm dừng của hero (phía trên bên phải, khoảng y < 360 trên khung 1080×1920).

Không cần ffmpeg: mã hóa bằng MediaRecorder VP9 trong Chrome. Muốn MP4/H.264 cho Zalo/Facebook cần ffmpeg (chưa dùng).

Ghi công ảnh (Wikimedia Commons) nằm ở cảnh cuối của clip. Màn hình là ảnh chụp ứng dụng thật; dữ liệu hiển thị là dữ liệu minh họa.
