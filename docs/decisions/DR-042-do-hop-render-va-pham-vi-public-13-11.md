# DR-042 — Đo hop proxy trên Render, bỏ R2, giữ repo private (13/11/2026)

**Trạng thái:** APPROVED (PO trả lời bằng `AskUserQuestion`, 13/11/2026; đo do Claude làm qua Chrome của PO). Master plan không đổi. Thay Q-d của DR-035 ("giữ 0") và RG5-1 của DR-039 ("đo rồi đặt N") bằng số liệu dưới đây.

## Sự thật tìm thấy trước khi làm (13/11/2026, đọc từ GitHub và Render)
- PR #1 "Portfolio upgrade" **đã merge** vào `main` (commit `fb51df9`). Sau merge: `backend-ci`, `web-ci`, `e2e` (126 kịch bản, 19 phút) xanh; `codeql` bị bỏ qua (repo private, chưa có code scanning); `keep-warm` chạy theo lịch và thành công.
- Render (`wander`, Free, Singapore, nhánh `main`) đã deploy đúng `fb51df9`. Đủ 7 biến môi trường (`SPRING_PROFILES_ACTIVE`, `WANDER_DB_*`, `WANDER_RECOVERY_*`, `WANDER_TRUSTED_PROXY_HOPS`): Neon, pepper, Render đã tồn tại. Chưa có `WANDER_PHOTO_BASE_URL`.
- 17 PR Dependabot đang mở. Vì vậy force-push lịch sử viết lại sẽ phá PR #1 và buộc tạo lại 17 PR.

## Số đo hop (Render Free, một mẫu mỗi trường hợp, từ một mạng)
| Cấu hình | Phép thử | Kết quả |
|---|---|---|
| hop=0, `WANDER_LIMIT_IDENTITY=2` | 8 lần `POST /api/identity` liên tiếp | **8 × 201**, không bao giờ 429 |
| hop=1, `WANDER_LIMIT_IDENTITY=2` | 4 lần, mỗi lần một `X-Forwarded-For` giả khác nhau (1.1.1.1…4.4.4.4) | **201, 201, 429, 429** |

Đọc kết quả: với hop=0, địa chỉ lấy từ kết nối TCP trực tiếp và có vẻ khác nhau giữa các yêu cầu (nguyên nhân chưa chứng minh, `UNVERIFIED`), nên mỗi yêu cầu rơi vào một thùng riêng, trái với giả định "cả hệ thống chung một thùng" trong runbook. Với hop=1, header giả không đổi được thùng: Render tự thêm địa chỉ thật vào cuối `X-Forwarded-For` và ứng dụng lấy đúng mục đó. Cấu hình đã nạp (giá trị lưu là 2, kiểm bằng cách hiện giá trị trên dashboard).

**Chưa làm được:** bước 4 của checklist (một yêu cầu từ mạng 4G khác phải ra 201, tức thùng riêng). Chỉ có một mạng. PO chọn **bỏ qua bước 4G**. Rủi ro còn lại: nếu hop=1 hóa ra "quá nhỏ" (mục cuối là proxy nội bộ của Render, không phải người dùng) thì mọi người chung một thùng; đó là hướng an toàn nhưng làm hạn mức 30 danh tính/giờ thành của cả hệ thống. Chưa thể phân biệt hai khả năng nếu không có mạng thứ hai.

## Quyết định
| Mã | Quyết định của PO | Hệ quả |
|---|---|---|
| HOP-1 | Chốt `WANDER_TRUSTED_PROXY_HOPS=1`, bỏ `WANDER_LIMIT_IDENTITY`, bỏ bước 4G | Đã đặt trên Render (13/11/2026). Mở lại nếu có mạng thứ hai hoặc nếu Render đổi số proxy; số hop chỉ đúng cho Render, không dùng cho AWS. |
| R2-1 | Bỏ qua R2 lúc này | Ứng dụng phục vụ ảnh từ chính image (ADR-016 coi R2 là tùy chọn). Trang hướng dẫn bước 6 để sẵn. |
| PUB-1 | Giữ repo **private**, không đụng lịch sử git | Không force-push, không tạo repo public mới. Hai key Google Maps của khách sạn vẫn nằm trong lịch sử (`480978dc76`), vô hại khi repo private. Quyết lại khi muốn public. Thay quyết định ORD-9 của DR-041 ("bỏ khỏi lịch sử trước khi public"): ORD-9 chỉ áp dụng khi đến lúc public. |

## Việc test phụ
Phép đo tạo thêm khoảng 14 danh tính thử trong DB Neon production (8 + 4 + 3 kiểm sau deploy). Không có dữ liệu chuyến đi kèm.
