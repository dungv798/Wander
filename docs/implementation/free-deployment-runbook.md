# Runbook Render + Neon cho Wander

Phạm vi: bản demo/cá nhân. Bắt đầu từ [audit trước deploy](deployment-security-audit-2026-10-30.md); các gate phát hành không tự được duyệt bởi runbook này.

## 1. Kiểm chứng local trước khi deploy

Tại root repo, sau khi đã có Java 21, Node 24, Docker:

```powershell
npm --prefix web ci
npm --prefix web run typecheck
npm --prefix web run lint
npm --prefix web test
npm --prefix web run build
```

Trong `backend`: `./gradlew.bat check bootJar --console=plain` (Linux dùng `sh ./gradlew`). Rồi quay lại root:

```powershell
docker build -t wander:deploy-audit .
powershell -NoProfile -ExecutionPolicy Bypass -File tools/deploy/smoke.ps1 -FullE2e
```

Smoke sinh DB/container riêng, đặt app ở `127.0.0.1:18787`, RAM 512 MiB không swap, 1 CPU, non-root/read-only/cap-drop/no-new-privileges. Secret test nằm trong `.logs` rồi được dọn; dữ liệu local thật không bị mount. Các quota cao trong smoke chỉ phục vụ test, không dùng các giá trị đó cho cloud.

## 2. Database Neon

Chọn Free, AWS Singapore, PostgreSQL 17 nếu có. Tạo database mới `wander` cho demo. Dùng direct endpoint cho một JVM/pool 3, không cần pooler ở lượt đầu.

Runtime vars nhập ở Render:

| Biến | Giá trị |
|---|---|
| `WANDER_DB_URL` | `jdbc:postgresql://<direct-host>:5432/<db>?sslmode=verify-full&sslfactory=org.postgresql.ssl.DefaultJavaSSLFactory` |
| `WANDER_DB_USER` | Role của DB demo |
| `WANDER_DB_PASSWORD` | Secret của role, không commit |
| `WANDER_RECOVERY_PEPPER` | Secret ngẫu nhiên >=32 byte; lưu bản sao trong password manager |
| `WANDER_RECOVERY_KEY_VERSION` | `v1` cho DB mới |
| `WANDER_TRUSTED_PROXY_HOPS` | Theo kết quả xác minh proxy thực tế, không sao chép số hop AWS |

Giữ hostname Neon để xác minh TLS/SNI; không thay URL bằng IP, không dùng SSL factory không xác minh. URL mẫu dùng truststore Java; phải chạy thử trên cloud và xử lý trust CA đúng cách nếu cần.

## 3. Render

Sử dụng root `render.yaml`: Docker, Free, Singapore, build context root, root Dockerfile, **auto deploy off**, health path `/actuator/health/readiness`. Đối chiếu dashboard vẫn hiển thị Free trước khi tạo. Không tạo Render Postgres Free cho dữ liệu cần giữ lâu dài.

Chọn commit đã kiểm. Image có profile `free`, frontend tại `/app/web`, bind `0.0.0.0`, đọc `PORT` platform. Runtime không cần Node hay JDK. Không thêm DB password/pepper vào build args hoặc biến frontend.

Lần đầu: Flyway tạo schema; `RecoveryKeyReadiness` kiểm các nhãn khóa cần dùng, hoàn tất trước app chuyển readiness sang nhận traffic. Probe readiness không query DB để tránh giữ Neon thức. API smoke với DB là bước riêng.

## 4. Xác minh sau deploy

1. HTTPS, root HTML/CSP, asset 200, asset thiếu 404/no-store, API private thiếu Bearer 401/no-store.
2. Catalog/ảnh/map/worker/font thật tải được dưới CSP; không wildcard hoặc `unsafe-inline` để né lỗi.
3. Tạo identity/chuyến/ngày/mục; sửa/xóa/hoàn tác; ghép thiết bị; khôi phục mã hai pha; dữ liệu còn khi redeploy.
4. Xác minh client IP từ hai mạng, **theo đúng thứ tự** (rà an ninh N6, 02/11/2026): (a) deploy với `WANDER_TRUSTED_PROXY_HOPS=0`; trong lúc đó mọi người dùng chung một bucket (30 danh tính và 30 khôi phục mỗi giờ cho cả hệ thống), nên chưa mời ai; (b) đo từ hai mạng khác nhau xem ứng dụng thấy địa chỉ nào và Render nối `X-Forwarded-For` thế nào; (c) chỉ đặt số hop **bằng đúng số proxy thật** (số nhỏ hơn thì chung bucket, an toàn hơn; số lớn hơn thì mục do client tự gửi được tin, kẻ tấn công né giới hạn hoặc đốt quota của người khác); (d) gửi X-Forwarded-For giả không đổi bucket của người thật. Số hop `2` trong `application.yml` chỉ dành cho CloudFront → ALB trên AWS, không sao chép sang Render. Không bật endpoint debug công khai chứa IP/header/token.
5. Ghi startup, peak memory, restart/OOM, warm latency, bandwidth/build minutes và Neon CU-hours/storage. Không suy tốc độ CPU cloud từ bài đo local.
6. Để idle tự nhiên và kiểm Neon có suspend; không dùng cron ping. Poll UI phải dừng đúng lúc. Sau cold start, mutation không bị retry mù gây ghi trùng.

## 5. Khóa khôi phục và xoay khóa

DB trước V17 được gắn nhãn `v1` mà không đổi digest. Vì vậy **khóa cũ phải tiếp tục mang đúng nhãn v1**. Đổi giá trị secret mà giữ cùng nhãn không phải xoay khóa hợp lệ và metadata không thể cứu mã cũ trong trường hợp đó.

Chuyển v1 → v2:

1. Backup DB và giữ chắc bản sao khóa v1; tạo khóa v2 mới, không ghi vào Git/log.
2. Cấu hình `WANDER_RECOVERY_KEY_VERSION=v2`, `WANDER_RECOVERY_PEPPER=<v2>`, `WANDER_RECOVERY_PREVIOUS_KEY_VERSION=v1`, `WANDER_RECOVERY_PREVIOUS_PEPPER=<v1>`.
3. Deploy; mã mới dùng v2, mã active và pending v1 vẫn xác minh bằng v1. Pending đã hiển thị vẫn giữ nhãn cũ khi commit.
4. Không bỏ v1 nếu còn mã active hoặc pending chưa hết hạn tham chiếu v1; guard profile free sẽ từ chối startup. Mã recovery không tự hết hạn nên có thể phải giữ khóa cũ lâu dài.
5. Cân nhắc cả retry attempt committed khi retire khóa, như mục tồn dư trong audit. Không xóa dữ liệu/attempt để ép retire khi chưa có chính sách retention được duyệt.

Kiểm metadata bằng truy vấn không chứa secret:

```sql
SELECT key_version FROM recovery_codes WHERE invalidated_at IS NULL
UNION
SELECT key_version FROM recovery_attempts WHERE state = 'pending' AND expires_at > CURRENT_TIMESTAMP
UNION
SELECT key_version FROM code_replacements WHERE state = 'pending' AND expires_at > CURRENT_TIMESTAMP;
```

Chỉ hỗ trợ hai khóa đồng thời. Trước vòng rotation tiếp theo, kiểm mọi version còn được tham chiếu; không ghi đè previous pepper và làm mất khóa thứ ba đang cần.

## 6. Backup/restore và rollback

Dùng `pg_dump -Fc` với client tương thích PostgreSQL 17, đọc credential qua cơ chế an toàn, không đặt password trong command history. Dump mã hóa lưu ngoài container/Git; pepper giữ riêng trong password manager. Thử `pg_restore` sang DB test trước khi tin backup. Chốt RPO/RTO và retention cùng chủ dự án; các mục này chưa được coi là đã hoàn tất cho cloud.

Trước migration: backup → kiểm CI/local quality của commit → deploy → smoke → ghi SHA/image và kết quả. Rollback app chỉ khi schema tương thích; không sửa migration đã áp dụng hoặc xóa Flyway history. Khi cần restore DB, nêu mức mất dữ liệu và xin quyết định cụ thể trước thao tác có thể ghi đè dữ liệu thật.

## 7. Chi phí và cảnh báo

Chỉ dùng quota Free; xem số thực trong dashboard khi tạo. Đặt ngưỡng nội bộ theo dõi 70%, dừng mở rộng demo ở 90%. Cấu hình payment/overage phải được chủ tài khoản biết; không tự nâng gói khi app thiếu RAM. Free có cold start, không có cam kết uptime. Database backup và RAM đủ không thay thế việc đóng rủi ro B2/F1/localStorage và RG-7 trước phát hành thật.
