# Kế hoạch DG-1: thiết kế UI/UX và user flow hoàn chỉnh

> Phase 2 của `spec-driven-development` (đặc tả: `docs/ux/design-spec.md`, đã duyệt, [DR-008](../decisions/DR-008-design-spec-duoc-duyet.md)). Danh sách việc: `todo.md`. Quy định cổng và kỹ năng bắt buộc: `.claude/rules/design-first.md`.
> Việc ở đây là **thiết kế và prototype**, không phải mã backend. Cổng DG-1 đóng thì mới làm backend mới.

## Tổng quan
Hoàn tất thiết kế cho cả sáu mô-đun (`foundation`, `trip`, `identity-ux`, `group`, `discover`, `admin`) ở hai cỡ màn hình (điện thoại 390 px, máy tính 1280 px), có prototype bấm được phủ F1–F14, ảnh chụp thật và phản biện độc lập. Mỗi việc là một **lát dọc**: luồng người dùng + màn hình + trạng thái + prototype + ảnh chụp, không làm "toàn bộ token rồi toàn bộ màn".

## Quyết định kiến trúc của phần thiết kế
- **Prototype là web tĩnh nhiều tệp** (`docs/ux/prototype/`): HTML + CSS + JS thuần, định tuyến theo hash, dữ liệu mẫu trong `data/*.json`, không build, chạy bằng máy chủ tĩnh cục bộ của script. Lý do: sửa nhanh, chụp ảnh được bằng playwright, publish được lên artifact bằng `files`, và là nguồn thiết kế cho React sau DG-1. Không dùng framework (Tầng A, AD-4).
- **Hệ thiết kế dùng token CSS** (sáng/tối) làm nguồn duy nhất; React thật sau này đọc cùng token (`web/src/discover/discover.css` là điểm khởi đầu đã chạy).
- **Dữ liệu mẫu** lấy từ kho biên tập thật (9 địa điểm Hà Giang) cộng dữ liệu chuyến mẫu; luôn ghi rõ "dữ liệu mẫu".
- **Mọi luồng có script bấm thật** (`docs/ux/tools/flows.mjs`) và mọi màn có ảnh chụp (`shots.mjs`); xem ảnh là bắt buộc trước khi báo xong.
- **Kích thước:** điểm ngắt mặc định 768 và 1280 px (Tầng B). Điện thoại một cột; 768–1279 hai vùng; ≥ 1280 ba vùng (danh sách, chi tiết, sơ đồ). Cổng quản trị chỉ tối ưu màn rộng.

## Đồ thị phụ thuộc
```
T1 công cụ chụp/thử/tương phản
 └─ T2 token + thành phần ─ T3 khung điều hướng thích ứng + trạng thái toàn cục (F14)
        ├─ T4 tạo/sửa chuyến (F3, đổi ngày, "dự kiến N ngày")
        │    └─ T5 xếp ngày (F4) ─ T6 mục + chi phí + đặt chỗ (F5, F6) ─ T7 xóa/Hoàn tác/Đã xóa (F7)
        ├─ T8 người mới + danh tính khi lưu lần đầu (F2) ─ T9 khôi phục, thiết bị thứ hai, bảo mật (F8)
        ├─ T13 hoàn thiện khám phá cho máy tính và trạng thái (F1)
        └─ T14 cổng quản trị (F12)
T5,T6,T7 + T8 ─ T10 mời và vào nhóm (F9) ─ T11 thêm, đề nghị xóa, duyệt (F10) ─ T12 tiến độ từng người + chia sẻ/xuất (F11, F13)
T4…T14 ─ T15 data-needs ─ T16 phản biện độc lập + sửa ─ T17 gói duyệt cho PO
```
Có thể song song sau T3: T8–T9 (danh tính), T13 (khám phá), T14 (quản trị) độc lập với chuỗi `trip`.

## Thứ tự và cổng kiểm
Chuỗi chính: T1 → T2 → T3 → `trip` (T4–T7) → `identity-ux` (T8–T9) → `group` (T10–T12) → T13 → T14 → T15 → T16 → T17. Sau mỗi cụm có checkpoint (xem `todo.md`): mở ảnh chụp, chạy script luồng, gọi `wander-skeptic-qa`, sửa, rồi mới sang cụm kế.

## Rủi ro và cách giảm
| Rủi ro | Mức | Giảm |
|---|---|---|
| Thiết kế hai cỡ màn gấp đôi công | Cao | Thiết kế điện thoại trước rồi lấy bố cục máy tính từ cùng thành phần (lưới, bảng bên); chốt ngắt ở T3; chụp 1280 ở mọi việc, không để dồn cuối |
| Prototype phình thành app thật | Trung bình | Chỉ dữ liệu mẫu, không gọi API; mỗi màn có trạng thái chọn từ thanh "BẢN THỬ" |
| Nội dung biên tập bịa/sai | Cao | Chỉ dùng dữ liệu đã có nhãn bản nháp; không số sao, giá, giờ mở cửa; ghi rõ ước tính |
| Quyết định Tầng A chặn việc (Q6–Q9, Q12 còn mở) | Trung bình | Thiết kế theo phương án đề xuất, gắn cờ "đề xuất, chưa là quyết định"; hỏi PO bằng lựa chọn khi tới lúc |
| Kỹ năng/agent bị bỏ quên | Trung bình | `/wander-design` và mục "Công cụ đã dùng" bắt buộc trong báo cáo |
| Chụp ảnh sai chỗ (ảnh khác bản đang xem) | Thấp | Script chụp tạo tên tệp theo màn/cỡ/giao diện và ghi mã băm prototype vào `docs/ux/screenshots/INDEX.md` |

## Câu hỏi mở (còn)
- Q-d cơ chế đăng nhập quản trị (Tầng A, hỏi lại ở giai đoạn backend admin).
- Q6–Q9, Q12 (1b) đang dùng phương án đề xuất ở F9–F11: mời bằng liên kết + tên hiển thị; thành viên thêm trực tiếp; đề nghị xóa chờ duyệt.
- Kích thước ảnh/hiệu năng tải trên mạng yếu (Q15): chỉ ghi yêu cầu vào `data-needs.md`, đo ở giai đoạn mã thật.

## Kiểm định hoàn thành mỗi việc (Definition of Done thiết kế)
Tiêu chí riêng của việc **và**: ảnh chụp 390 + 1280 px sáng + tối đã xem; script luồng liên quan chạy sạch (không lỗi console); tương phản đạt; vùng chạm ≥ 44 px; mọi cử chỉ có nút tương đương; trạng thái rỗng/lỗi/đang tải có; thuật ngữ theo bảng; báo cáo ghi "Công cụ đã dùng".

---

# Giai đoạn DG-2: thiết kế end-to-end và bộ màu mới (DR-012, 25/10/2026)

Spec: `spec-design-e2e-bang-mau.md` (APPROVED). Phần trên là kế hoạch DG-1 đã xong, giữ nguyên. Giai đoạn này **không có backend**; cổng DG-1 đã đóng (DR-010) nhưng PO yêu cầu thêm một vòng thiết kế trước khi làm backend.

## Tổng quan
Hai nhánh: **B** (bộ màu: 3 phương án → PO chọn → áp toàn app) và **A** (lấp các chỗ cụt của hành trình đầu–cuối). PO đã chọn: màn "Hôm nay" (Q1), onboarding 3 thẻ có thanh tiến độ (Q2), tạo chuyến nhiều bước + tuyến theo ngày (Q8), đều ở mức **khung** (không cam kết backend).

## Quyết định về thứ tự
- **B1–B2 và A1 song song** (không phụ thuộc nhau): màu là việc nhanh, PO xem ảnh sớm; A1 chỉ là tài liệu.
- **Dựng màn mới (A2–A9) chỉ sau khi PO chọn màu và B3 áp xong**, để khỏi dựng hai lần và tránh sai màu.
- Mỗi việc ≤ 5 tệp; việc L tách ra. Màn mới dùng token hiện có nên đổi màu sau vẫn hợp.

## Đồ thị phụ thuộc
```
B1 brief+3 bộ màu ─→ B2 palette-lab + ảnh ─→ [PO chọn: DR-013] ─→ B3 áp toàn app ─┐
A1 journey-map (xem nốt 28 ảnh) ────────────────────────────────────────────────┤
                                                                                  ├─→ A2…A9 (màn mới) ─→ A10 phản biện ─→ A11 gói duyệt (DR-014)
```
A2 (onboarding), A3 (tạo chuyến), A4 (tuyến), A5 (Hôm nay), A6 (hết phiên, lỗi), A7 (cài đặt), A8 (xuất), A9 (quản trị + gỡ thành viên) độc lập nhau sau B3; có thể làm song song.

## Rủi ro và cách giảm
| Rủi ro | Mức | Giảm |
|---|---|---|
| Vàng/xanh nhạt khó đạt tương phản 4,5:1 cho chữ | Cao | Chữ trên nền sáng luôn dùng mực tối; vàng chỉ làm nền/huy hiệu có chữ đậm; mỗi bộ chạy `contrast.mjs` trước khi trình PO |
| Đổi màu làm mất look DR-009 đã duyệt | Trung bình | Chỉ đổi token màu; gradient, bóng, huy hiệu giữ; nếu cần đổi thì hỏi PO |
| Bộ màu "tươi" làm vỡ tín hiệu phân loại (loại, ngày) | Trung bình | Tính lại `--cat-*`, `--d1…d7` cùng lúc, luôn kèm biểu tượng/nhãn |
| Phạm vi phình theo ảnh Roameo (nhập từ mạng xã hội, dùng thử trả phí, ngôi sao, đánh giá) | Cao | Q9 mặc định "không làm"; không số sao/đánh giá/giá; PO muốn thêm thì hỏi |
| Tạo chuyến nhiều bước đụng R5, A3, D16 | Trung bình | Chỉ khung, ghi vào `data-needs.md`; mọi thay đổi schema chờ PO (Tầng A) |
| Tuyến theo ngày cần tọa độ địa điểm | Trung bình | Dùng tọa độ đã có trong kho biên tập; địa điểm tự do chưa có tọa độ thì không vẽ, nói rõ |
| Chụp lại toàn bộ ảnh sau đổi màu tốn thời gian | Thấp | `shots.mjs` chạy một lần ở B3, chỉ xem ảnh đại diện + mọi màn đã sửa |

## Câu hỏi mở (còn)
Q3 (cài đặt/giới thiệu, mặc định dựng khung), Q4 (quản trị khung, mặc định dựng), Q5 (PO chọn bộ màu), Q7 (màu loại/ngày, mặc định tính lại), Q9 (nhập từ mạng xã hội/dùng thử trả phí: không làm). Q-d, A3, B2/B3/B4, E1, Q6–Q9/Q12 vẫn chờ PO ở backend.

---
# Giai đoạn "Hoàn tất Lát 1a": backend còn lại + nối FE với API thật (27/10/2026)

## Tổng quan
Backend lõi đã xong (danh tính, chuyến, mục, chi phí, thùng rác, lịch hàng loạt, tên thiết bị, ngày chưa chắc, `kind`/`interests`; `./gradlew check` xanh, 188 test). Còn: ba việc backend theo quyết định đã duyệt (lịch mẫu N-2, ghép máy có số khớp E1, HMAC mã khôi phục B3) và FE-10 (thay kho giả bằng API thật, viết lại e2e). Làm theo lát dọc, mỗi lát qua `/wander-feature` (TDD, phản biện bằng agent).

## Quyết định về thứ tự
- Backend trước FE-10 vì FE-10 phụ thuộc hợp đồng API ổn định; riêng lịch mẫu làm trước vì màn Trang chủ cần.
- FE-10 chia nhỏ theo miền (hạ tầng + catalog → chuyến/mục → danh tính) để mỗi lát chạy được và kiểm được bằng e2e thật.
- Việc cần hạ tầng AWS (khu vực IP bằng header CloudFront B4/E5, Secrets Manager thật cho pepper) để sau RG-5; pepper dùng biến môi trường trước.

## Đồ thị phụ thuộc
```
BE-7 lịch mẫu ──┐
BE-8 ghép máy E1 ┼─► FE-10a hạ tầng HTTP + catalog ─► FE-10b chuyến/mục ─► FE-10c danh tính ─► FE-10d e2e + dist
BE-9 HMAC B3 ───┘
```

## Rủi ro và cách giảm
| Rủi ro | Mức | Cách giảm |
|---|---|---|
| FE-10 quá lớn một lát | Cao | chia 4 lát (a–d), mỗi lát có e2e riêng, không sang lát sau khi chưa xanh |
| Hợp đồng API lệch với kiểu FE (position, kind mã, Hoàn tác) | Trung bình | viết bộ test hợp đồng (golden) giữa FE và `*IT`; đọc `error-codes.md` |
| Đổi cách băm mã khôi phục làm hỏng dữ liệu cũ | Thấp (chưa triển khai thật) | migration đánh dấu mã cũ hết hiệu lực hoặc băm lại; chỉ có dữ liệu thử |
| Nội dung lịch mẫu chưa được PO duyệt từng lịch | Trung bình | API trả cờ `draft`; FE hiện nhãn "Bản nháp" |

## Câu hỏi mở (còn)
- PO duyệt nội dung từng lịch mẫu (N-2).
- Lưu "Bạn mê gì?" theo danh tính (bảng mới) hay chỉ trên máy.
- Cho máy cũ xem tên máy lạ trước khi duyệt ghép (F3, đổi luồng xác thực, Tầng A).
