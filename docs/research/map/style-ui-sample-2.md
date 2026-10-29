# Đặc tả bản đồ từ UI-sample-2 — PO 29/10/2026

Phạm vi: DR-026 bước 4, giữ nền OpenFreeMap Liberty (ADR-015), bỏ hillshade theo chỉ đạo PO. Dùng skill [wander-implement](../../../tools/codex-skills/wander-implement/SKILL.md); không delegate. Đọc CLAUDE, frontend/planning-safety/decision-materiality/design-first và frontend-standards. Không có công cụ Skill Claude/code-review-graph callable; không tuyên bố đã chạy review chuyên gia.

## Bằng chứng và cách đo

Đã xem **6 ảnh**: crop R03-top, R05-top, R17-top, R31-top và ảnh gốc R03/R31. Ánh xạ tên tệp theo [manifest](../../design/crops/manifest.json), nội dung màn theo [roameo-spec](../../design/roameo-spec.md), phụ lục. Crop 780 px có tỉ lệ 2:1 so với khung tham chiếu 390 px; ảnh gốc 1290×2796. Các kích thước ước lượng dưới đây quy đổi về khung 390 px, không phải thông số CSS của app gốc. Không có metadata zoom hay style nguồn của Roameo.

Màu pixel được đọc bằng System.Drawing.Bitmap.GetPixel trên R03-top, tọa độ tính từ góc trên trái crop; JPEG, lớp phủ và nội suy có thể làm lệch màu. Các giá trị hex dưới đây là **bằng chứng bitmap**, không phải màu hard-code trong mã ứng dụng.

| Hạng mục | Quan sát/đo trong mẫu | Áp dụng cho Wander |
|---|---|---|
| Nước | R03 (620,420): `#63C8FE`; xanh sáng, có vùng đậm/nhạt ngoài khơi | `--map-water`; biển/hồ/sông cùng họ xanh, không giả địa hình đáy biển |
| Đất | R03 (190,240): `#F2FDE0`, nền sáng thiên kem/xanh | Pha 40% `--map-low` với 60% `--surface`, kem sáng |
| Mảng xanh/công viên | R03 (320,260): `#E4FACF`; chưa xác định đây là park hay landcover từ ảnh | Park/landcover pha 12% `--like` với 88% `--surface` |
| Cao tốc/đường chính | R05 thấy đường sáng, đoạn vàng nhạt và shield vàng; nét khoảng 1–2 px quy đổi, phân cấp theo class **UNVERIFIED** | Motorway/trunk/primary/secondary/tertiary dùng `--brand-soft`; casing pha 35% `--map-road-casing` với nền trắng |
| Đường phụ/đường mòn | R31 thấy nét mảnh xám nhạt; khoảng 0,5–1 px quy đổi; không đủ ảnh để phân biệt tertiary/residential/path chính xác | Dùng `--map-road`; giữ toàn bộ line-width/gap/filter và minzoom/maxzoom gốc; minor/path/track/service/residential/pedestrian/steps/cycleway mờ ở z≤11, hiện dần tới z12 |
| Ranh giới | R03 có nét đứt ngang khoảng 1 px; có thể là vĩ tuyến, **không đủ bằng chứng coi là biên giới chính trị** | Boundary dùng `--border-ctrl` pha 45% với trắng; giữ dash/width/filter của Liberty |
| Nhãn | R31 “Giếng Trời” chữ tối, đúng hoa/thường, khoảng 10–11 px quy đổi; halo tách biệt không đo được tin cậy | `--muted`, halo `--surface` 1,4 px; giữ text-size/font gốc; bỏ uppercase transform; `name:vi` → `name`, giữ format và ref |
| Ghim/cụm/tuyến | R03 ghim emoji trong vòng trắng đường kính khoảng 30–34 px, viền xám khoảng 1 px; chấm nhỏ 7–9 px. R17 tuyến màu nổi. **Không thấy cụm có số để đo** | Giữ ghim ảnh/cụm/tuyến native hiện có; không đổi sang emoji hay nhiều màu ngày |
| Địa hình | R05/R17/R31 **có dấu hiệu shading**, R31 có mảng sườn núi đa giác rõ; R03 biển có biến thiên sắc độ. Không thể kết luận mẫu “không có shading” | Theo PO: **bỏ hillshade/DEM, contour và mountain peak**, chọn nền phẳng để loại nguyên nhân “lởm chởm” |
| Mật độ theo tầm nhìn | R03 toàn châu lục: gần như chỉ ghim và chấm; R05 vùng Hong Kong: đường/shield ít; R31 khu điểm đến: sông/đường nhỏ và tên ghim. Zoom số **UNVERIFIED** | Giữ nhãn quốc gia/tỉnh/thành; POI, tên đường/sông, số nhà và tên village/hamlet/suburb/neighbourhood/quarter/isolated dwelling mờ tới z13, hiện dần tới z14 |

## Thay đổi và giới hạn

- `mapStyle.ts`: chỉ chỉnh paint/layout theo source-layer ngoài phần loại địa hình; giữ thứ tự lớp còn lại, nguồn vector và ghi công. Bỏ mọi nguồn `raster-dem`, terrain và lớp phụ thuộc DEM; bỏ lớp hillshade và lớp có id/source-layer khớp contour/mountain_peak/terrain shade. Liberty thực tế có lớp nào khớp cần Claude kiểm khi tải được style.
- Không còn thêm `wander-dem`/`wander-hillshade` hay URL AWS. Ghi công độ cao không còn được chèn vào UI; ghi công vector được giữ nguyên.
- `map.const.ts`: bỏ hằng DEM/màu hillshade hard-code; màu mới chỉ đọc/pha token Wander hiện có, không sửa `styles/tokens.css`.
- `GeoMap.ts`: truyền host vào loader để đọc đúng token kế thừa. Không sửa ghim/cụm/tuyến, data-ready/data-route/data-zoom hay tương tác camera.
- ADR-015 chỉ thêm ghi chú PO 29/10; không viết lại quyết định hoặc benchmark lịch sử.
- Test fixture **mô phỏng cấu trúc OpenMapTiles/Liberty**, không phải style Liberty thật tải về. Validator chấp nhận fixture sau biến đổi; chưa xác minh từng id/layer của dịch vụ hiện tại.
- Không mạng, không tải tile. Đã chụp [ảnh hình học giả](offline-minimal.png) bằng MapLibre/Chrome cục bộ, script [capture-offline.mjs](capture-offline.mjs), [style tối thiểu](offline-minimal.style.json): 3 nguồn GeoJSON, 5 lớp, loaded=true, 0 lỗi map/page, 0 yêu cầu mạng bên ngoài. Đã xem ảnh: nền kem, nước xanh, mảng công viên nhạt, đường vàng nhạt; **không khẳng định đẹp hoặc giống mẫu đã đạt**. Ảnh này chỉ kiểm render, không chứng minh dữ liệu/nhãn/Liberty thật. Claude cần chụp với tile thật tại tầm toàn quốc, thành phố và khu điểm đến.

## Kiểm chứng

Log trong [.logs](.logs/), tối đa ba vòng sửa–kiểm. Vòng 1 phát hiện test dùng thiếu rootKey/zoom của API createExpression; sửa ở vòng 2. Vòng 3 bổ sung trường nhãn legacy có tên + ref và màu đường dạng polygon. Kết quả cuối ghi trong `verification.md` sau khi đọc log. Không chạy e2e. Không thêm dependency, commit/push/deploy hoặc sửa phạm vi được giao ngoài build output được lệnh build sinh ra.
