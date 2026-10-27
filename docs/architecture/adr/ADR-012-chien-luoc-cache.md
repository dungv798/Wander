# ADR-012 — Chiến lược cache: chính sách + HTTP cache trước, Caffeine khi có ứng viên (AD-16)

- **Trạng thái:** `APPROVED` — PO chọn "B. Chính sách + HTTP cache, Caffeine khi có ứng viên (Recommended)" ngày 27/10/2026, sau khi xem trang kế hoạch `Wander Backend Blueprint` (mục AD-16). Khuyến nghị của agent trùng lựa chọn của PO.
- **Phạm vi:** quyết định hướng và chính sách. **Chưa thêm dependency** `spring-boot-starter-cache`/`caffeine`; dependency đó được thêm khi có ứng viên đầu tiên và đã được duyệt tại đây.

## Quyết định
| Mục | Chọn |
|---|---|
| Chính sách | Cache chỉ cho dữ liệu **chung, ít đổi**. **Không** cache dùng chung dữ liệu chuyến của người dùng. **Không** cache tra phiên (thu hồi phải có hiệu lực tức thì; muốn cache phiên với TTL ngắn là một quyết định bảo mật Tầng A riêng) |
| HTTP | `ETag` + `Cache-Control` cho GET công khai (catalog) và GET chuyến (`private, no-cache` + ETag để trình duyệt/service worker xác nhận lại; hợp Q15 và Q8: vẫn giữ 409 `CONCURRENT_MODIFICATION`) |
| Trong tiến trình | Caffeine **chỉ khi có ứng viên đầu tiên**: catalog chuyển vào DB (pha admin), kết quả thời tiết (N-4). Catalog hiện đã nằm trong bộ nhớ (`ClasspathPlaceCatalog` nạp vào `Map` lúc khởi động) nên chưa có việc |
| Dùng chung | Valkey/ElastiCache **chưa**. Xét khi chạy > 1 task (rate limit dùng chung, khóa; AD-6) |

## Ràng buộc khi thực hiện
- Mẫu cache-aside; chống dồn cache bằng `LoadingCache`; TTL kèm jitter; đo hit ratio (`cache.gets`) trước khi tin.
- ETag của catalog theo băm nội dung (không phải xóa cache thủ công).
- Giá ElastiCache Serverless Valkey (sàn 100 MB tính tiền, khoảng 6 USD/tháng theo một nguồn thứ ba) là `UNVERIFIED`; tra trang giá AWS ở RG-5.
- Ghi vào `decisions.md` §2 mỗi lần thêm một cache (tên, TTL, lý do, số đo hit ratio).

## Phương án đã cân nhắc
| Phương án | Kết quả |
|---|---|
| A. Chưa cache gì | Không chọn: không có chính sách, dễ cache sai khi catalog vào DB |
| **B. Chính sách + HTTP cache; Caffeine khi có ứng viên** | **Chọn** |
| C. Valkey/ElastiCache ngay | Không chọn: tiền cố định, thêm mạng/IAM, chưa có việc |

## Hệ quả
- Không thêm hạ tầng. Đảo ngược dễ.
- Học: cache-aside, hết hạn, đo hit ratio; vì sao cache phiên là rủi ro bảo mật.
