# TVC Wander (vertical 9:16, 24 s)

Dựng xác định từng khung hình (không quay thời gian thực nên không giật, không mờ) bằng Chrome + Three.js (MIT, chỉ là công cụ dựng, không vào bundle của app).

```powershell
cd tools/tvc; npm install                       # three@0.170 (devDependency)
node tools/tvc/capture-screens.mjs              # chụp màn hình THẬT của app (390×844, 3×, tile bản đồ thật, cần mạng)
$env:COMP='composition3d.html'                  # bản 3D (composition.html là bản 2D cũ)
node tools/tvc/render.mjs preview 1.5,8.2,12.8  # ảnh xem thử
node tools/tvc/render.mjs frames                # 720 khung PNG 1080×1920
node tools/tvc/encode.mjs master                # out/wander-tvc.webm  (1080×1920, ~26 MB)
$env:HERO_BITRATE='700000'; node tools/tvc/encode.mjs hero   # out/wander-hero.webm (720×1120, 9:14, ~2 MB)
```

Hero: chép `out/wander-hero.webm` thành `web/public/video/journey.webm`, poster lấy từ khung 8 s (`out/frames/f00240.png`, cắt 9:14). Giữ chữ trong vùng an toàn: tránh nút chọn điểm đến và nút tạm dừng của hero (phía trên bên phải, khoảng y < 360 trên khung 1080×1920).

Không cần ffmpeg: mã hóa bằng MediaRecorder VP9 trong Chrome. Muốn MP4/H.264 cho Zalo/Facebook cần ffmpeg (chưa dùng).

Ghi công ảnh (Wikimedia Commons) nằm ở cảnh cuối của clip. Màn hình là ảnh chụp ứng dụng thật; dữ liệu hiển thị là dữ liệu minh họa.
