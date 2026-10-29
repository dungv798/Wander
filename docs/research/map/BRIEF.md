# Brief giao Codex: giải pháp bản đồ (PO 29/10/2026)

PO bực vì bản đồ phải là ĐIỂM NHẤN của app. Phản hồi nguyên văn trên bản chạy thật (MapLibre GL + OpenFreeMap `liberty` + hillshade AWS terrarium; `web/src/shared/map/GeoMap.ts`, `MapLayers.ts`, `TerrainMapView.tsx`; ADR-015):

1. Lag, animation không mượt.
2. Trông KHÔNG trực quan, "giống bản đồ 20 năm trước trên giấy", chất lượng như 144p.
3. Bấm một địa điểm trên bản đồ thì ẢNH CHI TIẾT bị phóng siêu to theo tỉ lệ bản đồ (kích thước ảnh gắn với zoom bản đồ; tìm gốc rễ ở mã: thẻ/tờ chi tiết, ghim ảnh `.tm-pin img`, CSS).
4. ĐƯỜNG ĐI (tuyến nối các điểm trong ngày) không tương tác được với bản đồ (không chạm được đoạn/ghim để xem, không kéo đổi thứ tự, không có thông tin theo đoạn).

Ưu tiên GIẢI PHÁP CÓ SẴN đã kiểm chứng thay vì tự dựng (PO đã nhắc nhiều lần). Mỗi kết luận có bằng chứng (mã/đo/ảnh/nguồn URL + ngày đọc); UNVERIFIED nếu không kiểm được. Bạn KHÔNG có mạng: không tải được tile; việc đo cần mạng/GPU thật sẽ do Claude chạy.

## A. Chẩn đoán gốc rễ từng triệu chứng (đọc mã thật)
Ví dụ cần kiểm: ghim/cụm/nhãn là phần tử HTML định vị lại bằng JS ở mọi sự kiện `move` (layout thrash) so với lớp symbol/circle/cluster NATIVE của MapLibre trên GeoJSON source (cluster tích hợp, ảnh qua `map.addImage` hoặc ảnh thu nhỏ); hillshade raster-dem; `pixelRatio`, `maxTileCacheSize`, `fadeDuration`; ảnh ghim tải ảnh gốc to rồi thu nhỏ bằng CSS; tile raster so với vector; vì sao "mờ 144p" (devicePixelRatio, cỡ ô 256 vs 512, zoom, ô độ cao nghèo, nhãn nhỏ); style `liberty` phẳng kiểu giấy; vì sao ảnh chi tiết bị phóng to; vì sao tuyến không tương tác (lớp SVG/HTML hay layer GL).

## B. Phương án phong cách ĐẸP, hiện đại, trực quan
Nhắm cảm giác app du lịch hiện đại: nền sạch, tông ấm hợp bảng màu Nắng vàng, ghim ảnh tròn/giọt rõ, nhãn đậm gọn, tuyến có hướng, nghiêng nhẹ 2.5D, địa hình/3D tòa nhà tinh tế, bay mượt. So sánh ít nhất: các style công khai OpenFreeMap (liberty/bright/positron/fiord...), Protomaps (basemap tự host PMTiles), MapTiler/Stadia/Versatiles (điều khoản, free tier, API key, hợp app cá nhân không), chỉnh liberty bằng đổi paint theo token Wander, `terrain`/hillshade native so với raster hillshade hiện tại; chi phí GPU/băng thông; tile Việt Nam đủ chi tiết, nhãn tiếng Việt (`name:vi`). Mỗi phương án: nguồn, giấy phép/điều khoản, rủi ro, độ khó, tác động hiệu năng.

## C. Tương tác tuyến/bản đồ
(a) chạm đoạn tuyến/ghim -> thẻ nhỏ (ảnh thu nhỏ kích thước CỐ ĐỊNH, tên, giờ, khoảng cách/thời gian đoạn tới) + nút mở chi tiết; (b) kéo-thả đổi thứ tự ngay trên danh sách/bản đồ (dùng pattern/thư viện đã có ở dự án, xem `web/src/features/trips`); (c) tuyến theo đường thật (OSRM/Valhalla/OpenRouteService/GraphHopper...: điều khoản, rate limit, tự host) so với đường chim bay; dịch vụ ngoài = Tầng A; (d) animation tuyến, mũi tên hướng, màu theo ngày.

## D. Prototype + khung đo
Dựng trang thử `web/spike/map-lab/` (không đụng `web/src`) cho 2-3 cấu hình (A: liberty + symbol layer native + cluster GL; B: style đổi tông Wander; C: terrain/3D), dùng ghim thật từ `backend/src/main/resources/catalog/*.json` (Đà Lạt, Hà Nội, Hội An), kèm script đo playwright-core + Chrome (rAF frame time p50/p95/p99 khi kéo/zoom/bay, số DOM node, thời gian tới `idle`) chạy được khi có mạng. README một dòng lệnh + cách đọc số.

## E. Kết luận
Xếp hạng + lộ trình bước nhỏ có tiêu chí nghiệm thu đo được (p95 frame time, kích thước ảnh ghim, không còn phóng ảnh chi tiết). Tách: sửa ngay (không cần quyết định) / cần PO duyệt Tầng A (dịch vụ routing/tile, dependency mới, tự host PMTiles ở AWS). Với mỗi lỗi sửa được: mô tả diff chính xác (tệp, hàm), KHÔNG sửa `web/src` ở lượt này.

## Đầu ra
`docs/research/map/ban-do-giai-phap.md` (tiếng Việt kiểu dạy học, bảng so sánh, khuyến nghị, câu hỏi Tầng A), `web/spike/map-lab/`, `docs/research/map/README-do-hieu-nang.md`. Báo cáo MCP tóm 8 dòng. Không thêm dependency vào `package.json`. Không đọc/in bí mật. Không commit.
