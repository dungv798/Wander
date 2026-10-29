# DR-025 — Rating và gợi ý ăn/uống/nghỉ trong lịch (PO, 29/10/2026)

- **Trạng thái:** `APPROVED` theo câu trả lời của PO bằng `AskUserQuestion` 29/10/2026. Căn cứ: `docs/research/diem-sao-nguon-du-lieu.md`, `docs/research/da-lat-poi-trial/CLAUDE-HANDOFF.md`.
- **Liên quan:** DR-023 (không cào Google/TripAdvisor), DR-007 (nhãn biên tập), DR-024.

## PO nói gì
Muốn dữ liệu đủ và dùng lâu dài, có rating; hỏi về việc cào rating Google không cần API key. Mục tiêu sản phẩm: người dùng có cái nhìn trực quan, đầy đủ để cân nhắc và thêm vào chuyến đi; lịch chỉ có điểm tham quan mà thiếu nghỉ ngơi/ăn uống thì vô nghĩa.

## Trả lời của Claude (không phải quyết định)
Không cào Google: điều khoản Google Maps Platform §3.2.3 cấm cào và hạn chế lưu rating/đánh giá; dịch vụ cào hộ vẫn cào Google; không có plugin/connector nào lấy rating Google mà không dùng API chính thức. Cách hợp lệ: Google Places API gọi lúc xem, chỉ lưu `place_id` (cần billing, Tầng A) hoặc rating do người dùng Wander chấm.

## PO chọn
| Câu hỏi | Lựa chọn |
|---|---|
| Hướng rating | **Người dùng Wander chấm làm nền + liên kết "Xem trên Google Maps"**; chưa tích hợp Google Places. Không cào Google |
| Gợi ý bữa ăn/cà phê/nghỉ | **Làm ngay bằng dữ liệu OSM**, rating để sau |

## Hệ quả và việc còn mở
- Mô hình hai lớp: lớp POI ăn/uống OSM (tìm kiếm/định vị/gợi ý) và lớp Discover chỉ gồm địa điểm có ảnh đã duyệt. "Xếp giúp tôi" chèn khung ăn/nghỉ và cho đổi quán cùng khu; giờ mở cửa chỉ có ở khoảng 14% đối tượng nên là gợi ý mềm.
- **Tầng A còn lại:** schema/DB cho POI và provenance ảnh, thư viện đọc `opening_hours` nếu cần, thiết kế đánh giá của người dùng (quyền riêng tư, kiểm duyệt, "đã đi"), tích hợp Google Places sau này. Sẽ trình thiết kế cụ thể trước khi làm, dựa vào `docs/research/da-lat-poi-trial/VERIFY-MATCHES.md` khi Codex xong.
- Chưa nhập dữ liệu thử vào catalog/DB chính.
