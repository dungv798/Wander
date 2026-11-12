# ADR-015 — Bản đồ: MapLibre GL + OpenFreeMap + bóng núi từ ô độ cao AWS (thay bản đồ địa hình tự dựng)

> **English title:** Map: MapLibre GL + OpenFreeMap + AWS terrain hillshade
> **Summary (EN):** Replace the hand-built terrain map with MapLibre GL, free OpenFreeMap vector tiles and AWS open elevation tiles: no API key, zero cost; the allowed origins are pinned in the Content-Security-Policy.

- **Trạng thái:** `APPROVED` — PO chọn "MapLibre + OpenFreeMap + hillshade AWS (Recommended)" ngày 28/10/2026 (DR-023), sau khi yêu cầu "kiếm xem trên mạng có cách nào tối ưu, chứ tự dựng thì effort cao quá mà còn không chính xác". Việc tích hợp vào các màn là bước sau ADR này; chưa thay gì ở mã ứng dụng khi ghi ADR.
- **Liên quan:** DR-023, ADR-009 (dữ liệu miễn phí, chi phí 0), `docs/architecture/frontend-standards.md` (ngân sách JS ≤ 170 KB gzip, tải theo tuyến).

## Bối cảnh
Bản đồ hiện tại (`web/src/shared/map/TerrainMap*`) tự dựng bằng SVG + ảnh độ cao dựng sẵn bằng `docs/ux/tools/build-map.mjs`, chỉ có dữ liệu cho Hà Giang (≈ 2,3 MB/điểm đến). PO báo zoom lag, camera reset khi đổi ngày, ghim hoạt họa lại mỗi hành động, và cần phủ nhiều điểm đến cùng bản đồ Việt Nam khi tìm kiếm.

## Đã đo (28/10/2026, máy của PO, Chrome có cửa sổ + GPU, 1.200×800, cùng 60 sự kiện lăn chuột, mỗi bên chạy một lần)
| | Số khung | p50 | p95 | Khung > 33 ms | Khung > 100 ms | Đỉnh |
|---|---|---|---|---|---|---|
| Bản đồ tự dựng (SVG) | 134 | 16,7 ms | **50,3 ms** | 23 | 3 | 267 ms |
| MapLibre GL + OpenFreeMap liberty + hillshade AWS | 164 | 16,7 ms | **17 ms** | 3 | 0 | 50 ms |

Giới hạn của phép đo: bộ đo tạm `web/spike/map-bench.*` không nạp CSS của ứng dụng nên bản tự dựng thiếu kiểu ghim; một lần chạy mỗi bên; trình duyệt không đầu (WebGL chạy CPU) thì cả hai đều chậm và không so được. Kết luận chỉ là "MapLibre mượt hơn rõ trên GPU thật", không phải con số tuyệt đối.
Gói: `maplibre-gl@6.16.0` gom bằng Vite ≈ **281 KB gzip JS + 10 KB CSS** (bản 6 không còn `export default`; worker là tệp riêng `maplibre-gl-worker.mjs` ≈ 507 KB). Vượt ngân sách 170 KB ban đầu, nên **bắt buộc tải theo tuyến** (chỉ khi mở màn có bản đồ).

## Quyết định
> **Ghi chú PO 29/10/2026 (DR-026 bước 4):** giữ MapLibre + nền OpenFreeMap Liberty; đổi sang nền sáng, nước xanh dịu và bỏ hillshade AWS/nguồn raster-dem cùng ghi công độ cao Mapzen, AWS Open Data. Nội dung về hillshade và phép đo 28/10 dưới đây là lịch sử trước thay đổi này; không dùng làm bằng chứng hiệu năng của style mới.

1. Dùng **`maplibre-gl`** (BSD-3-Clause, ghim phiên bản chính xác) làm bản đồ; nền vector **OpenFreeMap** (`https://tiles.openfreemap.org/styles/liberty` làm gốc, chỉnh kiểu), bóng núi `hillshade` từ ô độ cao **AWS Terrain Tiles** (Terrarium, nguồn script cũ đã dùng).
2. Giữ **cùng giao diện thành phần** `TerrainMapView` (dest, markers, route, mode, insets, fit, selected, onPin…) để các màn không đổi; bên trong thay bằng lớp `GeoMap` dùng MapLibre. Ghim ảnh, cụm, nhãn vẫn là phần tử HTML đè lên (tận dụng `MapLayers`, `clusterPins`, `placeLabels` đã có test); tuyến vẽ bằng lớp đường GeoJSON.
3. Tải MapLibre bằng `import()` động; không để vào gói ban đầu.
4. Nhãn: dùng `name:vi`, rồi `name:latin`, rồi `name` (tránh chữ Hán lẫn vào gần biên giới như ảnh chụp Hà Giang).
5. Ghi công OSM/OpenFreeMap/OpenMapTiles trên bản đồ (MapLibre tự thêm) và nguồn ô độ cao.

## Rủi ro đã biết
- **OpenFreeMap công cộng không có SLA** (theo trang chính thức), có thể đổi hoặc ngừng. Giảm thiểu: lớp bản đồ chỉ biết URL kiểu qua một hằng số; khi phát hành thật tự host tệp bản đồ (PMTiles, ví dụ Protomaps trên Cloudflare R2) — **hoãn tới khi có hạ tầng** (PO: chừa hạ tầng cho tới lúc phát hành).
- Ô độ cao AWS là bucket công khai không cam kết; cùng cách giảm thiểu.
- Offline: bản cũ tải dữ liệu một lần; MapLibre cần mạng cho ô bản đồ. Chấp nhận ở giai đoạn này; ghi vào RG-7 (thiết bị thật).
- Kiểm thử e2e chạy trình duyệt không đầu: WebGL bằng CPU, chậm; phải đo lại các bài e2e có bản đồ.

## Hệ quả
- Thêm một phụ thuộc chạy (Tầng A, đã được PO duyệt).
- Sau khi các màn chuyển xong: bỏ `TerrainMap*`, `build-map.mjs` và `web/public/map/ha-giang` (≈ 2,3 MB).
- Thêm điểm đến không còn cần dựng dữ liệu bản đồ riêng.
- "Bấm tìm kiếm → bản đồ Việt Nam → bay tới điểm vừa nhập sau khoảng 1 giây": dùng `fitBounds` toàn quốc rồi `flyTo` (MapLibre có sẵn).
