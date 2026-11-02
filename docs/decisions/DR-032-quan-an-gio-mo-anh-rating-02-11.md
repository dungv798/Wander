# DR-032 — Giờ mở cửa, ảnh quán, rating quán; hoãn nhóm bảo mật Tầng A (PO, 02/11/2026)

- **Trạng thái:** `APPROVED` theo lời PO trong phiên 02/11/2026 và `AskUserQuestion` cùng ngày. Mục "chưa xác minh" ghi rõ bên dưới, **chưa phải quyết định cuối**.
- **Liên quan:** DR-031, `docs/architecture/place-record-design.md`, rà an ninh `docs/implementation/deployment-security-audit-2026-10-30.md`.

| Mục | PO chọn | Ghi chú / việc kế tiếp |
|---|---|---|
| Nhóm A (N4 dấu vân tay khóa V18, lịch gỡ khóa cũ, kết nối Render/Neon) | **Chưa làm** ("tầng A chưa làm") | Giữ nguyên trạng thái chờ; không tạo tài nguyên cloud; khóa cũ vẫn theo lựa chọn "ngày cắt cố định" (02/11), chưa có ngày |
| 4. Giờ mở cửa | **4c: dùng thư viện parse `opening_hours` của OSM** (thêm dependency runtime) | Tôi phải tự xác minh giấy phép và kích thước từ kho chính thức trước khi thêm. Nguồn tìm kiếm mâu thuẫn (BSD-2 theo README gốc, LGPL-3.0 theo một bản fork): **UNVERIFIED**. Nếu LGPL hoặc làm vỡ ngân sách JS thì chạy tải lười hoặc quay lại hỏi PO |
| 5. Ảnh quán | **5b: nhập ảnh có giấy phép đã kiểm chứng** (hướng Wikimedia Commons) | Mỗi ảnh lưu tác giả, giấy phép, URL gốc; quán không có ảnh thì dùng biểu tượng |
| 6. Rating quán | PO muốn **hai rating hiển thị cạnh nhau**: điểm "khách quan" từ nguồn ngoài (như điểm Google Maps 4,5 sao) **và** điểm từ người dùng Wander (ví dụ 5 sao) | Nguồn ngoài PO chọn **Foursquare Places**. Chưa xây: phải đọc điều khoản và giá chính thức của Foursquare (lưu trữ, ghi công, hạn mức), thêm khóa API phía máy chủ. Đây là Tầng A (dịch vụ ngoài, chi phí, ToS), cần PO duyệt lại sau khi có kết quả đọc |
| 6b. Cập nhật cùng ngày | **Trước tiên chỉ hiện rating của Wander** (điểm tổng hợp từ người dùng Wander + "Bạn chấm"); **chưa lấy điểm ngoài**. Không có cách miễn phí đã xác minh để lấy điểm Google; không scrape Google Maps (vi phạm điều khoản) | Foursquare hoặc nguồn ngoài khác chỉ xét lại khi PO muốn; khi đó phải đọc điều khoản chính thức trước |
| 7. Clip hero `--live` | **7a:** PO xem bản chạy thật rồi góp ý trước | Chưa quay |
| 8. Biên JS, nén `da-lat.json` | **8a:** tải lười thêm và nén khi sửa tới màn kế tiếp | Không nâng trần 170 KB |

## Trả lời bổ sung 02/11/2026 (`AskUserQuestion`, chạy một mạch)
| Mục | PO chọn | Kết quả |
|---|---|---|
| Phạm vi | Quét XSS, giờ mở cửa, rating Wander, ảnh quán từ Commons | XSS: xong. Rating Wander: xong (backend + FE). **Giờ mở cửa: dừng** (thư viện `opening_hours` là LGPL-3.0-only, theo điều kiện PO đã nêu). **Ảnh quán: hoãn** (xem dưới) |
| Luật chấm | **Hiện điểm từ 1 lượt** (khuyến nghị là từ 3) | Đã làm theo lựa chọn. Rủi ro: một người quyết định cả điểm, dễ hiểu lầm |
| Lời bình | **Sao + lời bình ngắn** (khuyến nghị là chỉ sao) | Đã làm: ≤280 ký tự, ẩn danh, báo cáo 3 người khác nhau thì ẩn; chưa có kiểm duyệt thủ công/admin |
| Bảng mục D | Duyệt nguyên bảng | Ghi ở `decisions.md` §3b |
| N4 dấu vân tay khóa (V18) | Làm | Xong, `RecoveryKeyFingerprintIT` |
| Ngày gỡ khóa HMAC cũ | 30 ngày sau lần xoay khóa đầu tiên | Ghi ở runbook §5 |
| Deploy Render/Neon | Chuẩn bị xong, dừng trước bước kết nối tài khoản | Không tạo tài nguyên cloud; xem báo cáo cuối phiên |

## Hai mục dừng, cần PO
1. **`opening_hours` (npm) giấy phép `LGPL-3.0-only`, gói ~5 MB chưa nén** (đọc từ `npm view`, 02/11/2026). Dùng trong FE nghĩa là bó thư viện LGPL vào JS gửi cho người dùng (LGPL yêu cầu cho phép thay thư viện; gói đã minify khó đáp ứng, rủi ro pháp lý và kích thước chưa đo). Phương án: (a) chấp nhận LGPL và tải lười một khối riêng sau khi đo kích thước; (b) viết bộ phân tích riêng nhỏ cho các mẫu giờ thường gặp, giữ chuỗi gốc cho mẫu lạ (khuyến nghị); (c) giữ chuỗi gốc như hiện tại. **Chưa thêm dependency.**
2. **Ảnh quán từ Commons: dữ liệu quá mỏng để nhập.** Nghiên cứu 29/10 (`docs/research/da-lat-poi-trial/VERIFY-MATCHES.md`) chỉ có vài ứng viên: WoodStock Coffee ghép ảnh ở mức LIKELY (chưa đủ bằng chứng cơ sở), Là Việt Coffee có ghép địa lý nhưng địa chỉ hiện hành xung đột, Cà phê Tùng cần chọn node. Không ứng viên nào đạt CONFIRMED đủ sạch; mô hình dữ liệu POI cũng chưa có trường ảnh duyệt. Không nhập ảnh. Phương án: (a) giữ biểu tượng, làm lại khi có tập ảnh được duyệt từng cái (khuyến nghị); (b) nhập riêng 1–2 ảnh có bằng chứng tốt nhất kèm thêm trường ảnh duyệt cho POI.

## Câu còn mở sau DR này
- Thang điểm Foursquare và cách hiện (không đổi sang 5 sao để khỏi sai lệch) — chờ xác minh tài liệu chính thức.
- "Điểm Wander" là tổng hợp mọi người dùng hay cá nhân: PO nêu ví dụ "5 sao từ người dùng Wander" cạnh điểm ngoài, tức tổng hợp; ngưỡng ẩn khi ít lượt và quyền xem còn chờ chốt.
