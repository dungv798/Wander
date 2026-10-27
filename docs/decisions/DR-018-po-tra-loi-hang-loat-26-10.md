# DR-018 — PO trả lời hàng loạt các câu Tầng A đang mở (26/10/2026)

- **Trạng thái:** `APPROVED` — lời PO trong phiên 26/10/2026 (trả lời bằng `AskUserQuestion`). Câu gốc: `docs/ux/po-questions.md`. Khuyến nghị của agent KHÔNG tự thành quyết định; bảng dưới là lựa chọn của PO.
- **Liên quan:** DR-001 (auth/khôi phục), DR-011, DR-015, DR-016, DR-017.

## 1. Sản phẩm và phạm vi
| Mã | PO chọn | Hệ quả |
|---|---|---|
| N-2 Lịch mẫu | **Đưa vào Lát 1a** | Cần mô hình dữ liệu + API đọc lịch mẫu. Nội dung: agent soạn bản nháp từ nơi có thật (không giờ/giá), **PO duyệt từng lịch**; chưa duyệt thì nhãn "Bản nháp" |
| G1 Đánh giá | **Chỉ "Wander gợi ý"** (nhận định biên tập) | Không có điểm sao/đánh giá người dùng; sao ngoài nguồn ngoài bị loại |
| G2/F2 "Bạn mê gì?", "Ai đi/Sở thích" | **Lưu vào chuyến (đổi schema)** | `kind`, `interests` thành thuộc tính chuyến ở backend (migration + API). Bước "Bạn mê gì?" trong onboarding được làm; dữ liệu đi theo chuyến |
| F4 Cụm màn dựng thêm (xuất Ảnh/PDF/Lịch, tải ảnh quản trị, tạo điểm đến, gỡ thành viên, hết phiên/lỗi/cài đặt) | **Không cắt**: PO: đây là việc của pha quản trị/cấu hình; làm hết ở các pha sau | Giữ nguyên làm khung; xếp vào pha sau (admin 1a-cuối/1b), không cam kết thứ tự trong 1a |
| N-1 Nhập từ MXH/Google Maps · N-2b Passport/Bộ sưu tập · N-3 AI tạo lịch/Tối ưu · N-4 Thời tiết + ảnh bìa/mô tả/quyền xem chuyến | **Cả bốn đều đưa vào kế hoạch** | Vào backlog có thứ tự sau Lát 1a. Mỗi cái còn câu Tầng A riêng khi tới lượt (nguồn/ToS cho N-1, nhà cung cấp AI + chi phí cho N-3, nguồn thời tiết cho N-4, schema quyền xem cho N-4): xem §5 |
| Q13 Số ngày | **Theo ngày lịch, gồm hai đầu** | R5 xác nhận (chuyến mẫu = 9 ngày) |
| Q9 "Chốt" / đề xuất bị từ chối | **Không dùng "chốt" ở 1a/1b; người đề xuất thấy "Đã từ chối"** (không lý do) | |
| A3 "Dự kiến N ngày" | **Cột `dates_tentative`**; thứ tính từ ngày đi, nhãn "chưa chắc" | Migration thêm cột + API |

## 2. Bảo mật / xác thực (bổ sung DR-001)
| Mã | PO chọn | Ghi chú |
|---|---|---|
| F1 Phiên danh tính chưa có mã | **Phiên trượt, không hết hạn** | Sửa copy màn S19 nhánh B (không biến TTL thành mất dữ liệu) |
| G5 Danh tính chưa có mã muốn xóa vĩnh viễn chuyến/đổi mã | **Bắt tạo mã trước** (xác thực lại D25 bằng mã) | |
| B2 Mã đầu tiên sau "bỏ qua" + thu hồi thiết bị không xác thực lại | **Giữ nguyên, chấp nhận rủi ro** | Ngược khuyến nghị (a). Rủi ro M1/M2 của security-reviewer vẫn là **mở ở RG-2**: người cầm máy bị trộm còn phiên có thể phát hành mã rồi dùng làm bằng chứng; thu hồi máy của chủ rồi phát hành mã → chủ mất quyền vĩnh viễn. Nhắc lại trước khi phát hành cho người dùng thật |
| B3 Xác nhận đã lưu mã | **Nhập lại 2 trong 6 nhóm do hệ thống chọn ngẫu nhiên** (+ HMAC có khóa/pepper trong Secrets Manager trước RG-2) | |
| B4/E5 Khu vực ước tính ở màn duyệt thiết bị | **Có, chỉ ở màn duyệt, không lưu lâu** | Không lưu IP thô; dùng header địa lý của CloudFront (không thêm dịch vụ tra IP) |
| E1 Số khớp khi ghép/duyệt xác thực lại | **Thêm số khớp + hạn mức yêu cầu duyệt** | Đổi cơ chế bảo mật của DR-001 |
| Q-d Đăng nhập cổng quản trị | **Spring Security + tài khoản admin nội bộ** | Kèm tối thiểu: tách tác giả/người xuất bản, nhật ký kiểm toán, CSP/CSRF, kiểm ảnh tải lên (E3) |

## 3. Nhóm (Lát 1b)
| Mã | PO chọn |
|---|---|
| Q6 Vai trò | **Hai vai: Organizer và Thành viên** (không "chỉ xem") |
| Q7 Liên kết mời | **Chỉ Organizer tạo, thu hồi được, hết hạn 7 ngày, bật lại = link mới** |
| Q8 Sửa đồng thời | **Khóa lạc quan: người sau nhận 409 + "Tải bản mới nhất"** |
| Q12 Checklist | **Đi cùng 1b; tick riêng từng người; ai cũng thấy tiến độ chung** (chỉ Organizer tạo hạng mục) |
| F3 Gỡ thành viên | **Chỉ người tạo chuyến** |

## 4. Kỹ thuật FE và quy trình
| Mã | PO chọn | Hệ quả |
|---|---|---|
| G3 Công cụ ép chuẩn FE | **Duyệt bộ ở `frontend-standards.md` §9, thêm khi bắt đầu pha FE** | devDependency (eslint-plugin-jsdoc, no-magic-numbers, jsx-no-literals, stylelint, boundaries, size-limit, jsx-a11y) |
| G4 "ACID" ở FE + `web/` | **Đồng ý bản dịch §6; đợi dựng lại từ prototype** (không sửa dần `web/` bây giờ) | |
| Bước tiếp theo sau thiết kế | **Chuyển sang dựng FE thật (pha FE) trước backend** | `web/` dựng theo prototype v6 + chuẩn FE, với API giả trước; backend sau. Dừng đúng chỗ khi gặp câu Tầng A còn mở (§5). Cổng DG-2: PO đã chọn đi tiếp bằng FE; không có biên bản đóng DG-2 riêng, xem §5 |

## 5. Còn mở sau DR-018 (Tầng A mới hoặc chưa hỏi)
1. **Q10** thứ tự Lát 2/3 và Q15 mạng yếu khi xem lịch (hoãn từ plan, chưa hỏi).
2. **Câu mới do mục N-1/N-3/N-4:** nguồn và điều khoản (N-1), nhà cung cấp AI + chi phí + quyền riêng tư (N-3), nguồn thời tiết (N-4), schema "ai được xem" (N-4). Chỉ hỏi khi tới lượt.
3. **Thứ tự và phạm vi pha** (1a-cuối vs 1b vs pha admin) cho N-1…N-4 và cụm F4.
4. **Đóng DG-2 bằng văn bản** (mục 8 của `design-first.md`) khi PO sẵn sàng; PO đã chọn đi tiếp bằng pha FE.
5. **Chưa quyết (hoãn có chủ đích):** nền tối; minh họa 3D thật (Lottie/Rive hay họa sĩ); trang chủ màn rộng; thử cảm ứng thật.
6. B2 chấp nhận rủi ro → nhắc lại ở RG-2 (mục 2).

> **Cập nhật cùng ngày — `DR-019`:** đóng DG-2; thứ tự pha; Q10 giữ; Q15 xem cache khi mất mạng. Các mục §5.1, §5.3, §5.4 ở trên đã được trả lời; còn lại §5.2, §5.5, §5.6.
