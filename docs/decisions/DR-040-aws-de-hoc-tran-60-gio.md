# DR-040 — Dùng AWS để học, trần 60 giờ (12/11/2026)

**Trạng thái:** APPROVED một phần; **AWS TẠM TREO (PO 12/11/2026: "thôi làm trên render trước đi")** (PO: "AWS 60 tiếng", 12/11/2026, trả lời câu "nơi chạy: Render hay AWS để học, cần trần giờ/tiền"). Master plan không đổi. **Chưa có phép tạo tài nguyên AWS nào**: các điều kiện còn thiếu ở mục "Chờ PO" phải xong trước (`planning-safety.md` mục 5, ADR-006 "Điều kiện trước khi tạo bất cứ tài nguyên nào").

## Quyết định
| Mã | Nội dung | Hệ quả |
|---|---|---|
| AWS-1 | Dự án được phép dùng AWS **để học**, trần **60 giờ làm việc** (DR-037 STR-1 cho phép với điều kiện có trần thời gian) | Mọi việc AWS (CDK, VPC, ALB, ECS, RDS, CloudFront, quan sát) tính vào 60 giờ. Hết trần thì dừng và báo, không tự gia hạn. Nhật ký giờ ở mục dưới, ước lượng của tôi (không đo được thời gian của PO). |
| AWS-2 | Hướng kỹ thuật đã có ở ADR-006 (APPROVED 24/10): ECS Fargate + ALB + RDS single-AZ, CloudFront cùng origin, CDK TypeScript, 1 task, bộ đếm trong bộ nhớ | Không mở lại. Với AWS, `WANDER_TRUSTED_PROXY_HOPS` = 2 (CloudFront → ALB) theo thiết kế, nên việc đo hop trên Render bỏ. Render/Neon + ping keep-warm giữ làm nơi chạy hiện tại cho tới khi AWS chạy được. |
| AWS-3 | AD-17 (trace OpenTelemetry/ADOT), AD-19 (Resilience4j, job queue), ADR-011 (Modulith + outbox) giữ mở "để học" (DR-038) | Chỉ làm bên trong trần 60 giờ, sau khi lõi AWS (CDK → deploy được) chạy. |
| T10 | Câu hỏi TOCTOU phiên đã thu hồi (`open-decisions.md`): PO trả lời chung "tất cả" cho cả danh sách | Diễn giải thận trọng: **chấp nhận (a) cho người quen** như đã khuyến nghị; phương án (b) `SELECT … FOR SHARE` ở mọi lệnh ghi chưa làm (đổi kiến trúc nhiều module) cho tới khi PO nói rõ. |

## Cập nhật cùng ngày
PO chọn làm trên Render trước. Trần tiền: PO chọn "tự đặt số khác" nhưng chưa nêu số. Tài khoản AWS: chưa có, chưa cài CLI. Trần 60 giờ vẫn giữ nguyên (chưa tiêu giờ nào ngoài ~0,2 giờ đọc/ghi). Khi PO quay lại AWS: cần số tiền, kiểu chạy và tài khoản (mục dưới). Trong lúc treo, `WANDER_TRUSTED_PROXY_HOPS` trên Render cần đo (RG-5) vì Render vẫn là nơi chạy.

## Chờ PO (Tầng A, trước khi tạo bất kỳ thứ gì)
1. **Trần tiền** và ngân sách tối đa (ADR-006 điều kiện 2); budget alarm là cảnh báo, không phải trần cứng.
2. **Kiểu chạy:** dựng-rồi-xóa theo buổi học (`cdk destroy` cuối buổi) hay bật liên tục.
3. **Tài khoản AWS và đăng nhập:** PO tự lập profile CLI/SSO; tôi không nhận hay in khóa truy cập.
4. Tra giá bằng AWS Pricing Calculator vùng `ap-southeast-1` (điều kiện 1 của ADR-006; hiện `UNVERIFIED`).

## Nhật ký giờ AWS (ước lượng)
| Ngày | Việc | Giờ |
|---|---|---|
| 12/11/2026 | Đọc ADR-006, ghi DR-040 | ~0,2 |
