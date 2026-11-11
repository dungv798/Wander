# Wander — lập kế hoạch chuyến đi

> English summary: [`README.en.md`](README.en.md). Bài viết về thiết kế khôi phục: [`docs/articles/recovery-design.md`](docs/articles/recovery-design.md).

Ứng dụng lập kế hoạch chuyến đi bằng tiếng Việt (dự án cá nhân để học). Hiện ở **Lát 1a**: một người dùng ẩn danh, lưu trên máy chủ, mở được trên thiết bị khác, chuyến → ngày → mục, sắp xếp thủ công, chi phí, xóa mềm + Hoàn tác, đặt chỗ, ngân sách.

> **Chưa được phát hành cho người dùng thật.** Cổng phát hành RG-2/5/6/7 còn mở (`docs/implementation/decisions.md` §3). Chưa có tài nguyên AWS nào.

Stack: Java 21 · Spring Boot 4.1 · Spring Security · Clean Architecture + DDD + CQRS · PostgreSQL (Flyway) · MapStruct — giao diện React 19 + TypeScript (Vite). Kiến trúc: [`docs/architecture/README.md`](docs/architecture/README.md).

## 1. Cần cài

| Công cụ | Phiên bản | Dùng để |
|---|---|---|
| JDK | **21** | Chạy và build backend (Gradle tự tải bản phụ thuộc, không cần cài Gradle) |
| Docker (Docker Desktop trên Windows/macOS) | bản mới, **đang chạy** | PostgreSQL cục bộ và test tích hợp (Testcontainers) |
| Node.js | **≥ 24** | Build giao diện, chạy e2e |
| Edge hoặc Chrome | bản mới | Chỉ cho test e2e (Playwright dùng trình duyệt đã cài) |
| Git | bất kỳ | |

Windows: `winget install Microsoft.OpenJDK.21` và `winget install Docker.DockerDesktop` (Docker có thể đòi khởi động lại máy vì WSL2). Hoặc để script cài: `powershell -ExecutionPolicy Bypass -File tools\dev.ps1 install-runtime`.

Kiểm tra máy: 

```powershell
powershell -ExecutionPolicy Bypass -File tools\dev.ps1 doctor
```

`[ok]` là đã có; `[miss]` ở java/docker/node/git là thiếu hoặc Docker Desktop chưa chạy. Các dòng `rtk`, `code-review-graph`, `uv`, `rg` là công cụ cho trợ lý AI, **không bắt buộc** để chạy app (xem mục 7).

## 2. Chạy nhanh (một lệnh mỗi bước)

Mở PowerShell tại thư mục gốc `D:\Wander`:

```powershell
powershell -ExecutionPolicy Bypass -File tools\dev.ps1 web-build   # cài dependency + build giao diện vào web\dist (lần đầu, hoặc khi đổi giao diện)
powershell -ExecutionPolicy Bypass -File tools\dev.ps1 run         # bật PostgreSQL (docker) rồi chạy backend, phục vụ cả giao diện
```

Mở **http://localhost:8787**. Lần đầu: "Bắt đầu lập kế hoạch" → tạo mã khôi phục (hiện một lần, **hãy lưu lại**) → tạo chuyến.

Dừng: `Ctrl+C` ở cửa sổ đang chạy. Dữ liệu nằm trong volume Docker `wander-pg` nên còn nguyên lần sau; xóa sạch: `docker compose down -v`.

`run` **không** tự build giao diện — nếu chưa có `web\dist` thì trang chủ không hiện (API vẫn chạy). Hãy chạy `web-build` trước.

## 3. Chế độ phát triển (sửa giao diện có tải lại nóng)

Ba cửa sổ terminal tại thư mục gốc:

```powershell
docker compose up -d postgres                       # 1) PostgreSQL ở 127.0.0.1:5433 (db/user/mật khẩu: wander)
cd backend; .\gradlew.bat bootRun                   # 2) Backend ở http://127.0.0.1:8787 (Flyway tự tạo bảng)
npm --prefix web install; npm --prefix web run dev  # 3) Giao diện ở http://localhost:5173, tự chuyển /api sang backend
```

Mở **http://localhost:5173** (dùng `localhost`, không dùng `127.0.0.1`: Vite chỉ nghe `localhost`). Sửa file trong `web/src/` là trình duyệt tự cập nhật.

### Chỉ giao diện (pha FE, chưa cần backend)

```powershell
npm --prefix web install
npm --prefix web run dev        # http://localhost:5173 — kho biên tập THẬT + trạng thái lưu trên máy (API giả)
npm --prefix web run typecheck; npm --prefix web run lint; npm --prefix web test   # cổng kiểm của pha FE
npm --prefix web run e2e        # Playwright (Chrome/Edge có sẵn), tự mở máy chủ Vite
npm --prefix web run shots      # chụp ảnh 390/1280 px vào docs/ux/screenshots/web/
node web/scripts/a11y.mjs       # quét truy cập tự động
node web/scripts/reflow.mjs     # kiểm tràn ngang ở 320 px và phóng 200% trên mọi màn
node web/scripts/swipe-perf.mjs # đo độ mượt kéo thẻ (trình duyệt không đầu; chưa thay cho thử trên máy thật)
```

Trong chế độ `dev`, các màn cần "thiết bị khác" hay máy chủ (ghép thiết bị, hết phiên, lỗi theo mã, giả lập ngày ở Hôm nay) có hộp **BẢN THỬ/GIẢ LẬP**; hộp này không hiển thị ở bản dựng (`vite build`), dù chữ của nó vẫn nằm trong gói JS. Danh tính ẩn danh, mã khôi phục và thiết bị đang chạy trên **máy chủ giả lưu trong trình duyệt** (`wander.web.server.v1`, chỉ giữ băm giả của mã), nên khôi phục chuyến đi thật chờ backend (FE-10). Lần đầu mở ứng dụng sẽ vào màn giới thiệu; thêm `?intro=0` vào địa chỉ để bỏ qua.

Giao diện gọi API thật qua `/api` (khi phát triển Vite chuyển tiếp tới backend ở cổng 8787). Kịch bản trình duyệt thật nằm ở `web/e2e/` (cần backend chạy ở cổng 8787; `toolsdev.ps1 e2e` tự dựng và chạy). Bản giao diện cũ giữ ở `legacy/web-v1/`.

Không dùng PowerShell hay Windows? Các lệnh trên giống nhau trên macOS/Linux (`./gradlew bootRun`); chỉ `tools/dev.ps1` là dành cho Windows.

Chạy backend trong container (cần build jar và giao diện trước): `cd backend; .\gradlew.bat bootJar`, `npm --prefix web run build`, rồi `docker compose --profile app up -d --build`.

## 4. Kiểm thử

| Lệnh (`tools\dev.ps1 …`) | Làm gì |
|---|---|
| `backend-test` | JUnit: luật kiến trúc (ArchUnit), test domain, test API tích hợp trên PostgreSQL thật (Testcontainers, cần Docker) |
| `e2e` | Build jar + giao diện, chạy backend ở cổng 18787, chạy kịch bản trình duyệt thật (Edge/Chrome, khung nhìn điện thoại) |
| `verify` | `doctor` + `tools-check` + `backend-test` + `e2e` (đo ngày 24/10/2026 trên máy phát triển: khoảng 2 phút) |
| `web-build`, `backend-build` | Build giao diện / jar |

Kết quả ghi ở `.logs\<lệnh>.log` và `.logs\<lệnh>.status` (`PASS`/`FAIL`). Báo cáo từng test: `backend\build\reports\tests\test\index.html`. Tóm tắt trạng thái dự án: `node tools/wander-status.mjs`.

Chạy nhanh một lớp test: `cd backend; .\gradlew.bat test --tests "com.wander.planning.TripOptionsApiIT"`.

> `verify` gồm `tools-check` (kiểm RTK và code-review-graph). Nếu bạn không dùng các công cụ AI này, chạy `backend-test` và `e2e` riêng.

## 5. Cấu hình (biến môi trường)

Mặc định chạy được ngay trên máy cá nhân. Giá trị mặc định lấy từ `backend/src/main/resources/application.yml`.

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `PORT` | `8787` | Cổng backend |
| `WANDER_BIND_ADDRESS` | `127.0.0.1` | Địa chỉ nghe (container đặt `0.0.0.0`) |
| `WANDER_DB_URL` / `WANDER_DB_USER` / `WANDER_DB_PASSWORD` | `jdbc:postgresql://localhost:5433/wander` / `wander` / `wander` | Kết nối PostgreSQL (mật khẩu mặc định **chỉ cho máy cá nhân**) |
| `WANDER_WEB_DIR` | trống | Thư mục giao diện đã build (vd `web\dist`); trống = chỉ API |
| `WANDER_LIMIT_IDENTITY`, `WANDER_LIMIT_RECOVERY`, `WANDER_LIMIT_APPROVAL` | `30`, `30`, `20` | Giới hạn thao tác mỗi giờ (tạo danh tính, khôi phục/ghép thiết bị, duyệt) |
| `WANDER_RECOVERY_PEPPER` | **bắt buộc**, không mặc định | Khóa HMAC-SHA-256 băm mã khôi phục, từ 32 byte (DR-018 B3). Thiếu hoặc ngắn thì ứng dụng không khởi động. `tools\dev.ps1` tự sinh khóa cục bộ ở `.logs\dev-recovery-pepper.txt`; đổi khóa làm mọi mã khôi phục hiện có vô hiệu |
| `WANDER_TRUSTED_PROXY_HOPS` | `0` | Số proxy tin cậy trước ứng dụng để lấy địa chỉ người gọi (`0` = bỏ qua `X-Forwarded-For`; sau CloudFront → ALB là `2`, chỉ khi ALB đã khóa nguồn) |
| `WANDER_LOG_SQL` | `info` | Đặt `debug` để xem câu SQL của Hibernate |

Không đặt bí mật thật vào repo. `.env` và `.env.*` đã nằm trong `.gitignore`.

## 6. Xử lý sự cố

| Triệu chứng | Nguyên nhân / cách xử lý |
|---|---|
| `failed to connect to the docker API … dockerDesktopLinuxEngine` | Docker Desktop chưa chạy. Mở nó, đợi "running", chạy lại. |
| Cổng `5433` hoặc `8787` đã bị chiếm | Tắt tiến trình cũ (`Get-NetTCPConnection -LocalPort 8787`) hoặc đổi `PORT`/cổng trong `docker-compose.yml`. Cổng 5433 được chọn để không đụng PostgreSQL cài sẵn (5432). |
| Trang chủ trắng / 404 ở `http://localhost:8787` | Chưa build giao diện: chạy `web-build`. |
| `http://127.0.0.1:5173` không mở được | Dùng `http://localhost:5173`. |
| Test báo `Could not find a valid Docker environment` | Docker chưa chạy hoặc Testcontainers không thấy; xem `docker info`. |
| e2e: `Không mở được trình duyệt (cần Edge hoặc Chrome)` | Cài Edge hoặc Chrome. |
| `Unsupported class file major version` / thiếu JDK | Cần JDK 21. Đặt `JAVA_HOME` trỏ tới JDK 21 (script `dev.ps1` tự tìm trong `Program Files`). |
| Mất mã khôi phục | Theo thiết kế (D20–D26) **không có đường khôi phục** nếu mất cả mã lẫn mọi thiết bị đang đăng nhập. Trên máy phát triển có thể xóa dữ liệu: `docker compose down -v`. |

## 7. Công cụ cho trợ lý AI (tùy chọn)

Dự án có workflow cho Claude Code (`.claude/`, hướng dẫn: [`docs/agent-system.md`](docs/agent-system.md)): `/wander-status`, `/wander-council`, `/wander-feature`, `/wander-verify`… Hai công cụ phụ trợ: **RTK** (rút gọn đầu ra lệnh) và **code-review-graph** (đồ thị mã cho review). Cài: `tools\dev.ps1 install-tools` (cài bằng winget/uv, cấu hình hook Claude Code, có sao lưu); kiểm tra: `tools\dev.ps1 tools-check`. Không cần cho việc chạy app.

## 8. Bản đồ thư mục

| Đường dẫn | Nội dung |
|---|---|
| `backend/` | Backend Java (modular monolith `identity`, `planning`, `shared`), migration Flyway, test |
| `web/` | Giao diện React + TypeScript (Vite) theo chuẩn `docs/architecture/frontend-standards.md`: `src/{app,features,shared,styles}`; API giả cho tới FE-10 |
| `legacy/web-v1/` | Giao diện React cũ (thay bởi `web/` mới; giữ để tham khảo, có thể xóa) |
| `web/e2e/` | Kịch bản trình duyệt thật (Playwright core) trên backend thật |
| `tools/` | `dev.ps1` (lệnh Windows), `wander-status.mjs` |
| `docs/` | Kế hoạch (`wander-master-plan.md`, **chỉ PO sửa**), kiến trúc + ADR, quyết định sản phẩm (`decisions/`), mặc định và cổng phát hành (`implementation/decisions.md`) |
| `docker-compose.yml` | PostgreSQL cục bộ (+ backend trong container, profile `app`) |

Muốn thêm một tính năng: công thức ở [`docs/architecture/README.md`](docs/architecture/README.md) §5 (domain → migration → infrastructure → application → API → test → e2e) và quy ước ở `.claude/rules/backend.md`, `.claude/rules/frontend.md`.
