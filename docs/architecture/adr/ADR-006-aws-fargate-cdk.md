# ADR-006 — Hướng triển khai AWS: ECS Fargate + ALB + RDS, CloudFront cùng origin, CDK TypeScript (AD-2, AD-3, AD-6)

- **Trạng thái:** `APPROVED` — PO chọn ngày 24/10/2026 sau phiên `/wander-council AD-2` (software-architect, security-reviewer, skeptic-qa; 1 vòng): "A: ECS Fargate + ALB + RDS", "Cùng origin qua CloudFront", "AWS CDK TypeScript", "In-memory, 1 task, sửa cách lấy IP".
- **Phạm vi:** chỉ **chọn hướng**. **Chưa tạo tài nguyên AWS, khóa bí mật hay pipeline nào**; việc đó vẫn cần PO duyệt riêng (`planning-safety.md` mục 5) và bị chặn bởi RG-1/RG-5.
- **Bổ sung cho:** ADR-002 ("AWS (target)"), ADR-005 (khung xác thực).

## Quyết định
| Mục | Chọn |
|---|---|
| AD-2 compute | **Amazon ECS Fargate + Application Load Balancer**, một service `wander-backend` chạy từ `backend/Dockerfile` |
| AD-2 DB | **RDS PostgreSQL single-AZ** (lớp nhỏ, ví dụ `db.t4g.micro`); không Aurora Serverless v2; Multi-AZ hoãn đến khi có người dùng thật |
| Topology | **CloudFront đứng trước**: `/` và `/assets` → S3 (`web/dist`), `/api/*` → ALB. UI và API **cùng origin**. ALB chỉ nhận lưu lượng từ CloudFront |
| AD-3 IaC | **AWS CDK (TypeScript)** |
| AD-6 giới hạn tần suất | Giữ bộ đếm **trong bộ nhớ**, **đúng 1 task** trong giai đoạn RG-1; sửa cách lấy địa chỉ client sau CloudFront → ALB. Redis hoãn đến khi chạy >1 bản; WAF rate rule thêm **trước khi phát hành thật** |

## Điều kiện trước khi tạo bất cứ tài nguyên nào (PO duyệt riêng)
1. Tra AWS Pricing Calculator vùng `ap-southeast-1` cho ALB, Fargate, RDS, NAT (nếu task ở subnet private), CloudFront, WAF. Giá hiện là `UNVERIFIED`.
2. Đặt **budget alarm**; ghi ngân sách tối đa PO chấp nhận.
3. RG-1 (Q16 duyệt) và RG-5 đóng các mục còn lại (sao lưu, giữ dữ liệu OQ-1).

## Đã làm trong code (24/10/2026, chưa tạo tài nguyên AWS)
`shared.web.ClientAddress` + cấu hình `wander.web.trusted-proxy-hops` (env `WANDER_TRUSTED_PROXY_HOPS`, mặc định 0): sau CloudFront → ALB đặt `2`, **chỉ khi** hạ tầng đã khóa ALB nhận từ CloudFront; test `ClientAddressTest`, `ClientAddressIT`, `ClientAddressDirectIT`. HSTS đã thêm ở `ResponseHeadersFilter`. Phần hạ tầng (security group, header bí mật) vẫn thuộc RG-5.

## Ràng buộc khi thực hiện (Tier B, đã ghi ở `decisions.md` §2)
- Địa chỉ client: đã làm trong code bằng `ClientAddress` (`wander.web.trusted-proxy-hops`, tin mục thứ N từ bên phải của `X-Forwarded-For`; đã có test giả mạo header, xem mục "Đã làm trong code"), không dùng `server.forward-headers-strategy`. Phần hạ tầng còn lại: ALB chỉ nhận từ CloudFront (managed prefix list + header bí mật) — nếu ALB mở ra internet thì kẻ tấn công lách được giới hạn; ALB phải để chế độ XFF mặc định "append". Security group: ALB → task, task → RDS 5432; RDS không public.
- Bí mật DB qua Secrets Manager; execution role chỉ `GetSecretValue` đúng một secret; task role tối thiểu.
- Migration Flyway theo kiểu **expand/contract** (khi rolling deploy, bản cũ còn chạy trên schema mới); health check tách liveness/readiness, start period đủ cho Flyway; `stopTimeout` và deregistration delay khớp `server.shutdown=graceful`.
- RDS: automated backup + deletion protection; diễn tập khôi phục một lần trước khi phát hành thật.

## Phương án đã cân nhắc
| Phương án | Kết quả |
|---|---|
| App Runner | **Loại**: AWS đưa vào maintenance mode, không nhận khách hàng mới từ 30/04/2026 (docs.aws.amazon.com/apprunner availability change; aws.amazon.com/about-aws/whats-new/2026/03/aws-service-availability, tra 24/10/2026) |
| ECS Express Mode | Không chọn: dịch vụ mới, hỗ trợ IaC/tài liệu `UNVERIFIED`, che phần mạng nên học ít hơn, có thể vẫn dựng ALB |
| Elastic Beanstalk | Không chọn: kiểu cũ, học ít, không ai khuyến nghị |
| EC2/Lightsail + Docker | Không chọn: rẻ nhất nhưng tự vá OS, ít giá trị học AWS doanh nghiệp |
| Hoãn AD-2 đến sau RG-1 | Không chọn (skeptic-qa khuyên, chi phí 0). PO chọn chốt hướng ngay vì không tốn tiền; điều kiện chi phí ở trên là phanh |
| Aurora Serverless v2 | Không chọn: phức tạp, có sàn chi phí, không có lợi ở quy mô một người dùng |
| Terraform | Không chọn: state riêng, nhiều cloud; đổi sau = viết lại hạ tầng (vài ngày) |
| Redis/ElastiCache, WAF ngay | Hoãn (xem AD-6) |

## Hệ quả
- Học: VPC/subnet/security group, ALB, task definition, IAM, rolling deploy, CDK. Giống kiến trúc doanh nghiệp. Chi phí cố định (ALB, có thể NAT) không giảm theo lượng dùng — rủi ro hóa đơn là lý do có điều kiện 1–2.
- **Mở khóa AD-1 phần 2:** cùng origin làm cookie HttpOnly khả thi (không CORS credentials). Quyết định nơi lưu phiên **vẫn chưa quyết**; `localStorage` tiếp tục là mặc định tạm (xem ADR-005, `decisions.md` §2).
- Không có state phiên trong bộ nhớ (phiên ở DB, ADR-005) nên deploy không làm mất phiên; chỉ bộ đếm rate limit bị đặt lại.

## Còn mở / gác lại
- OQ-1: thời hạn giữ dữ liệu của chuyến mất quyền vĩnh viễn và bản sao lưu — trước khi ra mắt thật.
- Độ dài/entropy mã khôi phục (băm SHA-256 không muối) — thuộc Q16.
- Kiểm tra HSTS ở `ResponseHeadersFilter`; hỗ trợ IaC của ECS Express Mode — không cần nếu không chọn.
