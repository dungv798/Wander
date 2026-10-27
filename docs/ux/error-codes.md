# Bảng mã lỗi → thông báo tiếng Việt (DG-2 A6)

> **Nguồn mã:** liệt kê bằng cách tìm các chuỗi mã trong `backend/src/main/java` (`WanderException`, `ApiExceptionHandler`, bộ lọc phiên, `RateLimits`) trong phiên 25/10/2026. **Chưa đối chiếu** từng mã với HTTP status và với bản `*IT` trong phiên này: ánh xạ status còn `UNVERIFIED`. Lời thông báo là **Tầng B** (copy), đổi được. Backend trả `message` tiếng Việt mặc định; giao diện nên dùng bảng này theo mã để thống nhất giọng văn và không lộ chi tiết nội bộ.
> **Quy tắc chung:** luôn hiện mã lỗi nhỏ (để hỏi hỗ trợ); **không đếm "còn N lần thử"** (MĐ-8); lỗi theo ô thì hiện cạnh ô (field có trong phản hồi); lỗi không theo ô thì hộp thoại `role=alert` với "Thử lại" / "Đóng" hoặc một lối đi cụ thể.

## 1. Phiên và quyền
| Mã | Ý nghĩa (đọc từ tên mã) | Giao diện | Màn |
|---|---|---|---|
| `UNAUTHENTICATED`, `INVALID_SESSION_TOKEN` | không có/không hợp lệ phiên | **Phiên hết hạn**: giữ chữ đang gõ; nhánh A (đã có mã/thiết bị tin cậy) → "Mở trên máy này"; nhánh B (đã bỏ qua mã) → nói thẳng không khôi phục được | S19 |
| `STEP_UP_REQUIRED` | thao tác cần xác thực lại | "Cần xác thực lại" → Bảo mật / hộp xác thực lại | S12, S20 |
| `INVALID_APPROVAL_CODE` | mã duyệt sai | thông báo chung "chưa đúng hoặc không còn hiệu lực" (không phân biệt sai/hết hạn) | S12 |
| `RATE_LIMITED` | quá giới hạn tần suất | "Bạn thao tác hơi nhanh. Chờ một lúc rồi thử lại. Dữ liệu của bạn không mất." (không đếm) | S20 |

## 2. Khôi phục và thiết bị (một thông báo chung, MĐ-8)
`INVALID_CODE`, `CODE_ALREADY_USED`, `CODE_CHANGED`, `INVALID_ATTEMPT`, `ATTEMPT_EXPIRED`, `INVALID_PAIRING_CODE`, `INVALID_REPLACEMENT`, `INVALID_OPERATION` → "Mã chưa đúng hoặc không còn hiệu lực." (hoặc "Mã ghép chưa đúng hoặc đã hết hạn."). `ATTEMPT_EXPIRED` ở bước thay mã: "Lần thử đã hết hạn. Hãy bắt đầu lại; mã mới vừa hiện không còn hiệu lực." (đã có ở S10, S13).

## 3. Dữ liệu chuyến đi
| Mã | Giao diện |
|---|---|
| `CONCURRENT_MODIFICATION` | tờ "Chuyến đi đã thay đổi" + Tải lại (G7) |
| `NOT_FOUND` | "Không tìm thấy. Mục này có thể đã bị xóa, hoặc chuyến đi không còn ở máy này." → Về Chuyến đi |
| `ITEM_DELETED`, `ALREADY_DELETED`, `NOT_DELETED`, `NOT_IN_TRASH` | "Mục này đã ở trong Đã xóa gần đây / đã được khôi phục" (đồng bộ lại danh sách) |
| `DATES_ORPHAN_ITEMS` | **đã bỏ** (backend, 27/10/2026, lát 2, `DR-011` A1): đổi khoảng ngày luôn được, mục lệch ngày về "Chưa có ngày" |
| `DAY_OUT_OF_RANGE` | **vẫn trả về** khi thêm hoặc chuyển một mục sang ngày nằm ngoài khoảng ngày của chuyến (400); không còn trả về khi khôi phục mục hay đổi khoảng ngày |
| `DUPLICATE_ASSIGNMENT` | **mới** (backend, 27/10/2026, lát 3) khi một mục xuất hiện hai lần trong `POST /api/trips/{id}/schedule` (400, trường `assignments`); lỗi do giao diện gửi sai → "Có lỗi ở phía Wander" + mã. Cũng ở lệnh này: `TOO_MANY` khi quá 500 phần tử, `MALFORMED` khi danh sách sai dạng, `REQUIRED` khi không nêu khoảng ngày lẫn danh sách; mọi lỗi đều không đổi gì (nguyên tử) |
| `NOT_A_TASK` | lỗi lập trình (giao diện không cho tích mục không phải việc cần làm) → "Có lỗi ở phía Wander" |

## 4. Kiểm tra giá trị (lỗi theo ô; lời hiện cạnh ô)
| Mã | Lời gợi ý (Tầng B) |
|---|---|
| `REQUIRED` | "Hãy nhập …" |
| `TOO_LONG` | "Tối đa N ký tự" (N theo ô: tên chuyến 120, tên mục 200, ghi chú 2000, lý do 200) |
| `TOO_LARGE` | "Số quá lớn" (ngân sách/chi phí ≤ 1.000.000.000 nghìn) |
| `NEGATIVE` | "Chỉ nhập số từ 0 trở lên" |
| `MALFORMED`, `INVALID_DATE`, `OUT_OF_RANGE` | "Giá trị chưa đúng định dạng" / "Ngày không hợp lệ" / "Ngoài khoảng cho phép" |
| `START_REQUIRED`, `END_REQUIRED`, `END_BEFORE_START` | "Hãy chọn ngày đi/về", "Ngày về phải sau hoặc bằng ngày đi" |
| `TOO_MANY` | "Quá nhiều lựa chọn" (ví dụ phong cách tối đa 5) |
| `INVALID_TYPE`, `INVALID_STYLE`, `INVALID_PACE`, `INVALID_ORDER`, `INVALID_BOOKING`, `BOOKING_NOT_APPLICABLE`, `REFERENCE_REQUIRES_INCLUDED` | lỗi do giao diện gửi sai (ít gặp); hiện "Có lỗi ở phía Wander" + mã; riêng `REFERENCE_REQUIRES_INCLUDED`: "Giá tham khảo chỉ nhập khi đã tick 'Đã bao gồm'" |

## 5. Truyền tải và nội bộ
`INVALID_JSON`, `BODY_TOO_LARGE`, `METHOD_NOT_ALLOWED`, `INTERNAL` → "Có lỗi ở phía Wander. Việc bạn vừa làm chưa được lưu. Thử lại sau ít phút." (`BODY_TOO_LARGE`: "Dữ liệu gửi đi quá lớn. Rút gọn nội dung rồi thử lại."). Mất mạng: không có mã, dùng thanh "Ngoại tuyến" (F14).

## 6. Đã dựng trong prototype (khung)
S20: hộp "lỗi theo mã" cho `RATE_LIMITED`, `NOT_FOUND`, `INTERNAL`, `STEP_UP_REQUIRED`, `BODY_TOO_LARGE` (giả lập ở Cài đặt → Giả lập). Các mã còn lại theo bảng trên khi nối backend. Kiểm: luồng `F18`.
