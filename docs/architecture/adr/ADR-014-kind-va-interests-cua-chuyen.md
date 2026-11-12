# ADR-014 — `kind` ("ai đi") và `interests` (sở thích) là thuộc tính của chuyến; tập mã `interests` do planning tự định nghĩa

> **English title:** Trip kind and interests: vocabulary owned by planning
> **Summary (EN):** Who is going (kind) and the trip interests are labels on a trip. planning defines its own enums, and a test keeps the interest codes identical to the catalog categories, so the modules stay decoupled.

- **Trạng thái:** `APPROVED`. Việc lưu hai trường vào chuyến (đổi schema) đã được PO duyệt ở `DR-018` (G2/F2, 26/10/2026). PO chọn "A. Enum riêng ở planning + test khớp với catalog (Recommended)" ngày 27/10/2026 cho câu hỏi tập mã `interests` sống ở đâu. Khuyến nghị của agent trùng lựa chọn của PO.
- **Phạm vi:** chỉ là nhãn như `styles` và `pace` (Q11): không gợi ý, không đổi hành vi nào khác.

## Bối cảnh
Màn "Tạo chuyến theo bước" có "Ai đi" (chọn một, có thể trống) và "Sở thích" (chọn nhiều). FE dùng nhãn tiếng Việt cho `kind` và mã loại địa điểm của kho biên tập (`canh, van, am, leo, luu, cho`) cho `interests`. Module `planning` không được import `catalog` (ADR-003, ArchUnit), nên `planning` không thể dùng `PlaceCategory`.

## Quyết định
| Mục | Chọn |
|---|---|
| `kind` | enum `TripKind` ở `planning.domain.vocabulary`: `solo` Một mình, `family` Gia đình, `friends` Bạn bè, `couple` Cặp đôi, `work` Công việc. Cột `trips.kind varchar(16)` cho phép NULL, có CHECK. Backend lưu **mã**, FE gửi mã (đổi ở FE-10) |
| `interests` | enum `TripInterest` ở `planning.domain.vocabulary`, **tự định nghĩa** 6 mã (`canh, van, am, leo, luu, cho`) và nhãn như `PlaceCategory`. Cột `trips.interests varchar(100) NOT NULL DEFAULT ''`, mã cách nhau bằng dấu phẩy, theo thứ tự khai báo, bỏ trùng, tối đa 6 |
| Giữ khớp với catalog | Một test (`VocabularyParityTest`, được phép import cả hai module vì chỉ chạy trong test) kiểm `TripInterest` và `PlaceCategory` có **cùng mã, cùng nhãn, cùng thứ tự**; lệch thì test đỏ |
| Hành vi | Chỉ là nhãn. Không nêu ⇒ giữ nguyên; `null` hoặc rỗng ⇒ xóa. Lỗi: `INVALID_KIND`, `INVALID_INTEREST` |
| API | `kind: {code, label}` hoặc `null`; `interests: [{code, label}]`; cùng dạng với `pace` và `styles` |
| Không gộp vào `styles` | `kind` có "Gia đình/Bạn bè", `styles` cũng có `family/friends`: hai khái niệm tách theo F2, giữ riêng |

## Phương án đã cân nhắc
| Phương án | Kết quả |
|---|---|
| **A. Enum riêng ở planning + test khớp catalog** | **Chọn** |
| B. Chuyển `PlaceCategory` sang `shared.kernel` | Không chọn: kéo từ vựng của catalog vào kernel chung, sửa nhiều chỗ, khó đảo ngược |
| C. Danh sách mã tự do chỉ kiểm dạng | Không chọn: không biết mã nào hợp lệ, dữ liệu rác lọt vào |

## Hệ quả
- Thêm một loại địa điểm ở catalog bắt buộc thêm một dòng ở `TripInterest` (test nhắc nếu quên).
- Khai báo hai lần, đổi lại giữ được ranh giới module và kiểm giá trị chặt như `styles`.
- Bước "Bạn mê gì?" ở onboarding vẫn lưu trên máy khi chưa có chuyến; lưu theo danh tính là quyết định riêng (bảng mới), chưa làm.
