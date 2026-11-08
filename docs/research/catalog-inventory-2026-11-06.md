# Kiểm kê đầy đủ dữ liệu Wander — 06/11/2026

Đếm trực tiếp tài nguyên backend, không suy tổng từ báo cáo cũ.

- **136 địa điểm Discover** trong 12 tệp `catalog/<destination>.json`; 272 ảnh địa điểm.
- **1.434 POI ăn/uống/cà phê phụ trợ** trong `catalog/poi/*.json`: Đà Lạt 628, Hà Giang 47, Hội An 753, Tà Xùa 5, Vĩnh Hy 1. Đây là bản chụp OSM có nguồn, chưa xác minh hiện trạng/giờ mở cửa; là tập riêng, không cộng thành 1.570 địa điểm đã biên tập.
- **85 khoảnh khắc** đang có trong catalog, gồm 50 cũ + 35 mới của đợt 05–06/11. Khoảnh khắc là ảnh đời sống theo điểm đến, không phải bản ghi POI mới.
- **450 ID ảnh ứng viên Unsplash** và **470 ID ứng viên Openverse** trong các tệp research. Hai nguồn chưa khử trùng chéo; không cộng thành 920 ảnh duy nhất hoặc nói tất cả đã được duyệt.
- Bản thử Đà Lạt có **817 đối tượng OSM ban đầu → 631 có tên → 628 POI sau gộp 3 trùng**. Tập 628 đã được đưa vào tài nguyên backend POI, không còn chỉ ở bản thử. Tập 116 ảnh ứng viên/quán và 4 ảnh shortlist vẫn cần kiểm ghép ảnh với đúng cơ sở trước khi dùng cho Discover.

## Phần làm chưa tới

Ảnh đời sống và ảnh đúng quán còn ít so với kho research; một số điểm đến chỉ có 2–5 khoảnh khắc. Kho POI hỗ trợ lên lịch lớn hơn rất nhiều phần Discover có ảnh, nên UI cần giữ rõ chức năng gợi ý ăn/uống thật, ghi nguồn và trạng thái chưa xác minh, không đánh đồng POI với ảnh khoảnh khắc.

Các phát biểu "146 địa điểm" và "817 bản ghi Đà Lạt vẫn toàn bộ chỉ ở bản thử" trong trao đổi trước là sai/thiếu; số liệu đã được sửa bằng kiểm kê này. Không nhập lại 628 POI hoặc tạo bản ghi trùng để tăng số.

Công cụ: `node tools/catalog/research-inventory.mjs --short`; kết quả máy đọc: `.logs/photo-wave/research-inventory.json`. Bằng chứng luồng dùng POI: `ClasspathPoiCatalog`, `PoiController`, `web/src/features/trips/api/poi.api.ts`, `useMealSuggestions.ts`. Báo cáo ảnh đợt mới: [photo-curation-2026-11-05.md](photo-curation-2026-11-05.md).
