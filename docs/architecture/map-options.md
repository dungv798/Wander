# Bản đồ của Wander: nghiên cứu và các lựa chọn (AD-14, chờ PO)

> **Trạng thái: PO chọn (a) ngày 26/10/2026 ([DR-017](../decisions/DR-017-giu-bo-mau-hien-tai-va-ban-do-rieng.md)): giữ bản đồ riêng tới hết Lát 1a.**
> Soạn 26/10/2026 sau phản hồi của PO: "nghiên cứu thật kĩ phần map, khá đơn điệu". **Chỉ phần prototype đã làm** (§2). Chọn công nghệ cho sản phẩm thật là **Tầng A** (thư viện mới, nguồn dữ liệu, chi phí): xem §4.
> Số liệu giá dưới đây lấy từ trang bên thứ ba, có thể cũ: `UNVERIFIED`, kiểm lại trước khi quyết.

## 1. Vì sao bản đồ cũ đơn điệu
Bản đồ trong chuyến đi là nền kem vẽ tay bằng SVG (vài mảng màu, một con sông giả), ghim chỉ là chấm màu, không có địa hình, đường hay tên địa danh, không kéo/phóng được. Người đi Hà Giang chọn nơi vì **địa hình** (đèo, hẻm vực, cao nguyên đá), nên đây là chỗ bản đồ nên "kể chuyện" nhất.

## 2. Đã làm trong prototype: "bản đồ địa hình riêng của Wander" (không thư viện, không khóa API)
| Thành phần | Cách làm |
|---|---|
| Nền | Ảnh bóng núi (hillshade đa hướng) dựng sẵn từ **độ cao thật** (AWS Terrain Tiles, zoom 12, ~35 m/điểm ảnh) + ảnh độ cao chuẩn hóa để **tô dải màu theo token** (đổi bộ màu thì bản đồ đổi theo, không dựng lại) |
| Đường, sông, thị trấn | OpenStreetMap qua Overpass (622 đường chính, 178 sông, 9 địa danh), đã chiếu sang điểm ảnh và đơn giản hóa (170 KB) |
| Hiển thị | `docs/ux/prototype/app/map.js` (lớp `TerrainMap`): camera bay mượt, kéo/chụm/lăn chuột, gộp cụm ghim, nhãn không chồng, ghim là ảnh tròn thật + số, tuyến là cung có viền trắng **vẽ dần**, chấm sáng chạy dọc tuyến, nhãn km từng đoạn, tên thị trấn khi phóng đủ |
| Dựng dữ liệu | `node docs/ux/tools/build-map.mjs --dest=ha-giang` (một lần; bộ nhớ đệm `.tmp/map/`); điểm đến mới = thêm khung bao vào `CONFIG` |
| Ghi công | "Độ cao: AWS Terrain Tiles · Đường, sông: © OpenStreetMap" hiện ở góc bản đồ (ODbL bắt buộc) |
| Dùng ở | Chuyến đi (nền cả màn, tờ kéo 3 nấc), trang điểm đến và trang chủ (thẻ + "Mở rộng" toàn màn), "Đã chọn", chi tiết địa điểm (bản đồ nhỏ nối với TP Hà Giang), giới thiệu cảnh 3 |
Ưu: đẹp, **đúng thương hiệu**, offline, miễn phí, không phụ thuộc bên thứ ba, nhẹ ở máy người dùng (ảnh + SVG). Nhược: **tĩnh** (không xoay/nghiêng, không chi tiết đường nhỏ/POI), ảnh nền ~2 MB cho một điểm đến (cần cắt ô hoặc dùng PMTiles khi có nhiều điểm đến), tuyến là **đường chim bay cong** chứ chưa theo đường thật.

## 3. Phương án cho sản phẩm thật (đã tra)
| | A. Giữ bản đồ riêng (mở rộng) | B. MapLibre GL JS + vector tile | C. Mapbox GL JS / Google Maps |
|---|---|---|---|
| Là gì | Như §2, thêm điểm đến bằng `build-map.mjs`; có thể thêm tuyến theo đường bằng đồ thị OSM tự dựng | Thư viện nguồn mở (BSD) vẽ bản đồ vector tương tác; nguồn tile: **OpenFreeMap** (công cộng, không khóa, không giới hạn công bố, nhờ quyên góp, **không có cam kết dịch vụ**) hoặc **Protomaps/PMTiles tự lưu trên S3 + CloudFront** (không máy chủ tile; ước tính của chính Protomaps ~120 USD/tháng ở 625K phiên và 1 TB băng thông, **số này cũ**) | Dịch vụ trả phí theo lượt tải: Mapbox ~50K lượt miễn phí/tháng rồi ~5 USD/1K lượt; Google 10K lượt miễn phí/SKU rồi ~7 USD/1K (cần thẻ thanh toán) |
| Đẹp/đúng gu | Cao nhất (tự thiết kế) | Cao nếu tự viết style; mặc định "giống mọi app" | Cao, nhiều style sẵn |
| Tương tác (xoay, nghiêng 3D, theo dõi vị trí) | Hạn chế | Đầy đủ | Đầy đủ |
| Tuyến theo đường thật, tìm kiếm | Phải tự dựng | Cần dịch vụ định tuyến/geocoding riêng (OpenFreeMap không có) | Có (trả phí) |
| Chi phí vận hành | Gần 0 (tệp tĩnh) | Gần 0 → thấp (tự lưu) hoặc 0 (OpenFreeMap, rủi ro dịch vụ) | Tăng theo người dùng |
| Phụ thuộc/rủi ro | Công sức bảo trì dữ liệu | Thêm thư viện (Tầng A); OpenFreeMap có thể đổi chính sách | Khóa API, giá thay đổi, ràng buộc điều khoản |
| Học được gì | Xử lý dữ liệu địa lý, SVG, hiệu năng | Hệ sinh thái bản đồ nguồn mở, PMTiles + CDN (hợp học AWS) | Dùng SDK trả phí |
Khuyến nghị (**không phải quyết định**): giữ **A cho giai đoạn thiết kế và Lát 1a**; chuẩn bị **B với PMTiles tự lưu trên S3** (hợp hướng AWS đã duyệt, chi phí thấp, học được nhiều) cho khi cần xoay/nghiêng, theo dõi vị trí hay nhiều điểm đến. Tránh C ở giai đoạn cá nhân/học vì chi phí và khóa API.

## 4. Việc cần PO quyết (Tầng A)
- **AD-14:** (a) giữ bản đồ riêng tới hết Lát 1a (khuyến nghị) · (b) chuyển MapLibre + OpenFreeMap ngay · (c) MapLibre + PMTiles tự lưu (cần thêm dependency và hạ tầng S3/CloudFront, phụ thuộc ADR-006) · (d) Mapbox/Google.
- Tuyến theo đường thật (không phải đường chim bay) cần nguồn định tuyến: **chưa quyết, chưa làm**.

## 5. Nguồn đã đọc
- Xu hướng màu/chuyển động 2026 (Envato, Updivision, Kreativa…): gradient mềm làm "ánh sáng nền", ít bão hòa hơn, khởi đầu không bắt đăng ký (xem tóm tắt ở `docs/ux/research-ui-2026-10-26.md`).
- OpenFreeMap: openfreemap.org (không khóa, quyên góp, tự lưu được, không có tìm kiếm/định tuyến).
- Protomaps/PMTiles: docs.protomaps.com/deploy (và /deploy/cost), blog.apps.npr.org/2024/11/26/slippy-maps.html.
- MapLibre + tuyến/hoạt họa: docs.maptiler.com (animated route), github.com/w3cj/openfreemap-examples.
- Giá: woosmap.com/blog/mapbox-pricing, storerocket.io/learn/mapbox-pricing (bên thứ ba, có thể cũ).
- Dữ liệu dựng bản đồ: AWS Terrain Tiles (s3.amazonaws.com/elevation-tiles-prod), OpenStreetMap qua Overpass API.
