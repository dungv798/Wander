# Bản đồ hành trình đầu–cuối (DG-2, A1)

> Nguồn: `screens.md` (S1–S13, G1–G7, A0–A3), `user-flows.md`, spec `docs/implementation/spec-design-e2e-bang-mau.md`, DR-004, DR-011, DR-012 (PO chọn: onboarding 3 thẻ, màn "Hôm nay", tạo chuyến nhiều bước + tuyến theo ngày, ở mức **khung**), và **50 ảnh tham chiếu** `docs/UI-sample/` (đã xem đủ 50). Ảnh chỉ để hiểu **gu và nhịp**, không sao chép (không logo, minh họa 3D, số liệu/đánh giá, dùng thử trả phí, nhập từ mạng xã hội). Mã màn mới đánh số tiếp S14…; trạng thái: **Có** (đã dựng), **MỚI** (cần dựng ở DG-2), **Khung** (dựng nói thật là chưa nối), **Ngoài** (không làm, có lý do).

## 1. Hành trình chính của một người lạ
| # | Bước người dùng | Màn | Trạng thái | Ghi chú / lỗ hổng |
|---|---|---|---|---|
| 1 | Mở app lần đầu | **S14 Onboarding 3 thẻ** (có thanh tiến độ, bỏ qua được, hiện một lần) | **MỚI** | Hiện chưa có; app mở thẳng vào Khám phá. Ảnh tham chiếu có 10+ bước, kể cả khảo sát, bằng chứng xã hội và thanh toán: **Wander chỉ 3 thẻ** (Quẹt nơi mê → Gom thành chuyến → Của bạn, không cần email; chuyện mời nhóm chưa nói vì 1b chưa quyết), không số liệu bịa; nội dung là bản nháp có nhãn |
| 2 | Khám phá, tìm điểm đến | S1 Khám phá | Có | |
| 3 | Đọc cẩm nang | S2 | Có | |
| 4 | Quẹt chọn | S3 Bộ thẻ | Có | Ảnh tham chiếu có nút "Finish" luôn thấy khi quẹt; Wander có "Xem đã chọn (n)" |
| 5 | Xem chi tiết một nơi | S4 | Có | |
| 6 | Xem đã chọn | S5 | Có | |
| 7 | Lưu thành chuyến đi (lần đầu) | **S9 → S10** danh tính + mã khôi phục | Có | Wander ẩn danh, không đăng nhập Google/Apple/email như ảnh tham chiếu (D15, QĐ-1): **khác có chủ ý** |
| 8 | Tạo chuyến | **S15 Tạo chuyến nhiều bước** (Đi đâu → Khi nào → Ai đi → Sở thích → Ngân sách) thay/nối S7a | **Khung** | Ảnh tham chiếu dùng 5 thẻ mở rộng. Ràng buộc: R5, D16, D17. **"Ai đi" = kiểu chuyến đi** (một mình / gia đình / bạn bè / cặp đôi / công việc), **không** phải số người hay danh sách thành viên (Q6–Q9 của 1b còn mở). **"Ngày linh hoạt" dùng lại ô "Dự kiến N ngày" đã có ở prototype; khung này KHÔNG quyết A3** (cờ ngày tạm vẫn chờ PO). "Ai đi" và "Sở thích" **chưa có chỗ lưu ở backend** → chỉ khung có nhãn, ghi vào `data-needs.md` (rà soát product-analyst 25/10: phải nói rõ để PO không hiểu nhầm là đã chốt) |
| 9 | Xem tổng quan chuyến | S7 Tổng quan | Có | Tham chiếu có thêm thời tiết, ghi chú, danh sách mang theo, mã giảm giá. Wander không thêm thời tiết (không có nguồn dữ liệu), **không** mã giảm giá |
| 10 | Xếp địa điểm vào ngày | S7 Ngày n; "Xếp giúp tôi" | Có | |
| 11 | Xem **tuyến trong ngày** trên bản đồ | **S16 Tuyến theo ngày** (đường nối theo thứ tự, nhãn ngày nhiều màu, ước lượng đi bộ/xe giữa các điểm) | **Khung** | Chỉ dùng tọa độ **đã có** của điểm trong kho biên tập (không thêm dữ liệu); **mục tự do không có tọa độ → không vẽ, nói rõ**. Số phút/km là "ước tính" theo công thức đã có ở prototype (`air()`), không bịa |
| 12 | Thêm hoạt động vào một ngày | S7b | Có | Tham chiếu có "Chọn ngày" ở đầu và tab "Dành cho bạn / Đã lưu": tương ứng "Chọn ngày" + "Đã chọn" của Wander |
| 13 | Sắp xếp lại, giờ, chi phí, đặt chỗ | S7, S7b | Có | |
| 14 | Xóa, Hoàn tác, Đã xóa gần đây | S8 | Có | DR-011: giữ đến khi xóa tay, không xác thực lại từng mục |
| 15 | Mời người đi cùng | G1 | **Khung (1b)** | Tham chiếu có hộp xác nhận "Chia sẻ chuyến này? Ai có liên kết đều mở được; có thể đặt riêng tư lại ở Cài đặt chuyến": Wander cần câu tương tự (Q6–Q9 mở) |
| 16 | Đặt tên, đổi ngày chuyến | S7a | Có | **Ảnh bìa tải lên, mô tả, "ai được xem" KHÔNG dựng ở DG-2**: chưa nằm trong DR-012; "ai được xem" thuộc Q6/Q7 (1b) và ảnh bìa kéo theo lưu trữ tệp (Tầng A). Xem câu hỏi C ở mục 4 |
| 17 | **Đang đi** (dùng thật) | **S17 Hôm nay** | **Khung (PO chọn)** | Kế hoạch ngày hiện tại, việc cần làm, chi đã biết, mở bản đồ/điều hướng ngoài. Chỉ đọc từ dữ liệu chuyến đã có; "hôm nay" theo **múi giờ của thiết bị** (Tầng B, ghi `decisions.md`); "mở bản đồ/điều hướng" là liên kết ra app ngoài, nói rõ |
| 18 | Chia sẻ, xuất | **S18 Xuất** (xem trước Ảnh, PDF, Lịch) + liên kết chỉ-đọc | **Khung** (liên kết chỉ-đọc là **1b**, chờ Q6–Q9) | Tham chiếu: ảnh dài theo ngày với giờ, tên, địa chỉ, ảnh nhỏ; chia sẻ Stories/WhatsApp. Wander: dữ liệu mẫu có nhãn, không logo/liên kết ngoài |
| 19 | Mở trên máy khác, khôi phục | S11, S12, S13 | Có | |
| 20 | Hết phiên (người dùng thường) | **S19 Hết phiên**, **hai nhánh** | **MỚI** | Giữ chữ đang gõ. Nhánh A (đã có mã khôi phục hoặc thiết bị tin cậy): dẫn tới "Mở trên máy này". Nhánh B (**đã bỏ qua mã, không còn thiết bị tin cậy**): nói thẳng không khôi phục được (D20, D26) và dẫn tới tạo danh tính mới. TTL phiên còn ở "Đã gác lại" (Tầng A) nên khung không cam kết thời hạn |
| 21 | Lỗi mạng/máy chủ | **S20 Lỗi theo mã** (bảng mã → tiếng Việt, `docs/ux/error-codes.md`) | **MỚI** | Hiện chỉ có lỗi tải/offline chung |
| 22 | Cài đặt và giới thiệu | **S21 Cài đặt / Về Wander** (tên thiết bị, nguồn dữ liệu, ghi công ảnh, quyền riêng tư, mở lại onboarding) | **Khung** | Gom từ Bảo mật + "Về dữ liệu" |
| 23 | Chuyến tạo nhầm | Ghi chú trong S6/S21: "Chuyến đi không xóa được ở phiên bản này" | **MỚI (chữ)** | DR-004: 1a không có xóa chuyến; người dùng cần biết. OQ-1 (giữ dữ liệu chuyến mất quyền) vẫn phải quyết trước RG-5 |

## 2. Quản trị (PO)
| Bước | Màn | Trạng thái |
|---|---|---|
| Đăng nhập | A0 | Khung (Q-d chưa chốt) |
| Danh sách điểm đến / chi tiết / địa điểm | A1–A3 | Có (khung) |
| **Tải ảnh lên** (kiểu tệp, kích thước, ghi công, bỏ EXIF) | **A4** | **Khung MỚI** |
| **Tạo điểm đến mới** (bản nháp) | **A5** | **Khung MỚI** |

## 3. Nhóm 1b (thiết kế, ngoài backend 1a)
G1–G7 có; **G8 Gỡ thành viên** (xác nhận, hệ quả lên mục họ đã thêm/đề nghị) **MỚI, khung**.

## 4. Mục có trong ảnh tham chiếu mà Wander KHÔNG dựng
**Không (đã có căn cứ trong plan hoặc quy tắc dự án):**
| Mục trong ảnh | Lý do |
|---|---|
| Đăng nhập Google/Apple/email, mã khuyến mãi | Danh tính ẩn danh (D15, D22, QĐ-1) |
| Khảo sát "bạn biết tới app từ đâu", "điều gì đưa bạn tới" | Chỉ thêm ma sát; Q2 đã chọn 3 thẻ |
| Bằng chứng xã hội (điểm sao, "500K+ chuyến", lời chứng thực, đồ thị "ngăn nắp hơn"), điểm sao ở thẻ địa điểm | Cấm bịa số/đánh giá (`design-spec.md` §7); không có nguồn dữ liệu |
| Dùng thử 7 ngày, trả phí, khôi phục mua hàng | Tiền hóa hoãn (CLAUDE.md) |
| Mã giảm giá eSIM, đối tác | Không có trong plan |

**CÂU HỎI MỞ CHO PO (không tự loại; rà soát product-analyst 25/10 chỉ ra đây là quyết định của PO, đặt tên "N-…" để khỏi nhầm với Q6–Q9 của plan):**
| Mã | Mục trong ảnh | Mặc định tạm thời (chưa phải quyết định) |
|---|---|---|
| N-1 | Nhập địa điểm từ Instagram/TikTok/Google Maps ("Send to …", "Import Spots") | Chưa dựng. Tầng A: phụ thuộc dịch vụ ngoài + nguồn dữ liệu |
| N-2 | "Passport", "Trip Ideas" (lịch trình mẫu), Bộ sưu tập, bản đồ thế giới | Chưa dựng. Tầng A: nội dung biên tập mới |
| N-3 | "Tạo lịch trình bằng AI / Tối ưu" | Chưa mới. "Xếp giúp tôi" gom địa điểm gần nhau là **suy luận của agent** rằng đã đủ; PO xác nhận nếu coi hai thứ khác nhau |
| N-4 | Thời tiết "Before you go" | Chưa dựng: cần nguồn dữ liệu thật |
| C | Cài đặt chuyến: ảnh bìa tải lên, mô tả, "ai được xem" | **Không dựng ở DG-2** (ngoài DR-012; quyền xem thuộc Q6/Q7; ảnh bìa kéo theo lưu trữ tệp). Chỉ giữ tên + ngày (S7a) |

## 5. Cách đọc "không còn ngõ cụt"
Sau DG-2, mọi bước ở mục 1 trỏ tới một màn **Có** hoặc **Khung** (nói thật là bản thử/chưa nối). Chỗ còn "Khung": S15, S16, S17, S18, S21, A4, A5, G8. **Khung không cam kết backend** (DR-012): mỗi màn khung có nhãn "BẢN THỬ" và một dòng nói rõ phần chưa nối; backend chỉ làm sau khi PO duyệt từng thay đổi schema/API (Tầng A).

## 6. Nhu cầu dữ liệu mới (ghi vào `data-needs.md` ở A11, chưa quyết schema)
- **S15:** kiểu chuyến đi ("ai đi") và sở thích là thuộc tính chuyến mới; "ngày linh hoạt" **không** quyết A3. Ảnh hưởng schema → **Tầng A**.
- **S16:** chỉ dùng tọa độ đã có của điểm trong kho; mục tự do không vẽ. Không thêm dữ liệu.
- **S17:** không thêm dữ liệu; "hôm nay" theo múi giờ thiết bị (Tầng B); liên kết ra app bản đồ ngoài.
- **S19:** TTL phiên còn "Đã gác lại" (Tầng A); khung chỉ ghi hai nhánh, không cam kết thời hạn.
- **A4, A5:** nằm trong backend quản trị (Q-d chưa chốt).
- Ảnh bìa, mô tả, quyền xem chuyến: **chưa quyết, không dựng** (câu hỏi C).
