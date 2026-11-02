# Rà an ninh trước deploy miễn phí — 30/10/2026

## Kết luận hiện tại

**Chưa triển khai cloud, chưa tuyên bố an toàn cho người dùng thật.** Đã chuẩn bị image Render/Neon và sửa các vấn đề được xác nhận khi rà source. Phần vận hành cloud vẫn cần kết nối tài khoản, xác minh proxy/TLS, backup và smoke trên domain thực tế. Release gate RG-2/5/6/7 không tự đóng vì test xanh.

Ủy quyền trong phiên: PO yêu cầu “t muốn deploy luôn, trước khi deploy nhớ scan source kĩ và check xem có an toàn ko, ko đc phớt lờ các cảnh báo từ các phiên trước của claude”. Hướng triển khai là bản demo/cá nhân theo [kế hoạch nghiên cứu](free-deployment-research-plan.md); không tạo tài nguyên tính phí hoặc tự thay cơ chế auth đã duyệt.

## Phạm vi và cách kiểm tra

- Đọc source hiện tại của identity, shared/web, planning authorization, frontend HTTP/token/export/map, cấu hình build và runtime.
- Đối chiếu `decisions.md`, DR-018, DR-022, các checklist FE và báo cáo Claude. Những ghi chú cũ mâu thuẫn với source mới được ghi rõ, không dùng nguyên trạng làm bằng chứng hiện tại.
- Hai reviewer độc lập chỉ đọc: an ninh backend và frontend/deployment; một vòng rà ban đầu, một vòng phản biện các bản sửa.
- Chạy lại backend baseline thật, full quality gate sau sửa, FE checks, npm audit, gitleaks cây làm việc và lịch sử, Trivy dependency baseline; image/runtime kiểm riêng.
- Không dùng dữ liệu người dùng thật; smoke dùng PostgreSQL/container riêng, credential ngẫu nhiên chỉ dùng cho test, không mount DB local.

## Đối chiếu cảnh báo Claude và xử lý

| Cảnh báo | Bằng chứng hiện tại | Xử lý / trạng thái |
|---|---|---|
| B2: giữ một phiên có thể phát mã đầu tiên hoặc thu hồi máy khác, dẫn đến mất quyền chủ thật | DR-018, `RecoveryService.beginReplacement`, `IdentityService.revokeSession` | **HIGH, ACCEPTED RESIDUAL** theo quyết định trước. Chưa sửa; nhắc lại trước phát hành thật |
| F1: phiên bị chiếm tự ghép máy thứ hai, rồi tự duyệt step-up để đổi mã | `decisions.md` BE-8, `DeviceLinkService`, `RecoveryService` | **HIGH, ACCEPTED RESIDUAL** theo PO 27/10. Mutex và rotation không khắc phục đường tấn công này |
| HMAC chưa có version/rotation, đổi pepper làm hỏng mọi mã | `HmacRecoveryCodeHasher`, BE-9 và quyết định hoãn đến trước phát hành | **ĐÃ SỬA phần kỹ thuật**: V17 thêm `key_version` cho active/pending; hai khóa; guard startup; test xuyên chuyển khóa. Quy trình giữ/backup/retire khóa vẫn phải vận hành đúng |
| “Chưa có HMAC” hoặc “chưa sửa client IP/chưa có test giả mạo” | Source đã có HMAC, `ClientAddressIT`, `ClientAddressDirectIT` | Các mô tả cũ này đã lỗi thời; không lặp lại thành lỗi hiện tại. **Cấu hình proxy cloud vẫn UNVERIFIED** |
| E2E Vite không nhận CSP backend nên từng bỏ sót bản đồ hỏng | `decisions.md` mục bản đồ 29/10; các e2e cũ dùng Vite dev/preview | Thêm `backend-production.e2e.test.ts`: HTML từ backend thật, listener CSP giữ qua navigation, tile thật, canvas/feature, API 401/no-store, asset 404. Test này đã PASS trong suite container đang chạy |
| Asset thiếu trả HTML 200 rồi cache immutable một năm | `SpaFallbackResolver`, `ResponseHeadersFilter` | **ĐÃ SỬA**: asset/file thiếu không fallback; lỗi từ advice no-store trước khi ghi response; test bốn đường dẫn |
| Mốc 10.000 khóa chỉ dọn, không giới hạn thật; request mới có thể làm RAM/CPU tăng | `FixedWindowRateLimiter` | **ĐÃ SỬA**: trần cứng, hết dung lượng thì từ chối khóa mới, prune có nhịp, giới hạn tăng count; test dung lượng và concurrency |
| Có identity rồi có thể gửi ghi planning liên tục | `TripController` và bộ đếm cũ | Thêm ngân sách ghi 120 request/phút/identity, dùng chung các thiết bị, chạy trước body/controller; test 429 không tạo thêm chuyến. Đây là hạn mức request, **không phải trần dung lượng DB** |
| Test recovery “đồng thời” cũ thực ra tuần tự; confirm có khoảng trống khóa | `RecoveryApiIT.twoAttemptsOneWinner`, `RecoveryService` | **ĐÃ SỬA/BỔ SUNG**: khóa identity theo cùng thứ tự, bỏ snapshot trước khóa và đọc lại; ba HTTP race thật: recovery–recovery, confirm–confirm, recovery–confirm |
| Vite middleware giải mã URL có thể throw, kiểm tiền tố thư mục chưa đủ | `todo-fe.md`, `vite.config.ts` | **ĐÃ SỬA**: bắt decode lỗi, giới hạn thư mục photos bằng delimiter và realpath, chỉ cho phần mở rộng ảnh. Production vẫn chạy Java, không chạy Vite preview |
| F3/F4: IPv6 chưa gộp /64, nhiều identity/session tăng ngân sách đoán | `ClientAddress`, BE-8 | **OPEN**. Trần RAM và ngân sách ghi theo identity chỉ giảm một phần tải, không đóng cảnh báo này |
| Token trong localStorage có thể bị lấy nếu có XSS | ADR-005, RG-6 | **OPEN/ACCEPTED DESIGN**. Giữ CSP chặt, không đổi cookie hoặc nới CSP; chưa có bằng chứng đủ để tuyên bố miễn XSS |
| Safari/iPhone/Android thật, mạng yếu, GPU chưa kiểm đủ | RG-7 và ghi chú nghiệm thu Claude | **OPEN**. Chromium mobile viewport không thay thế kiểm trên thiết bị thật |
| Backup/retention, pepper backup và bảo vệ môi trường cloud | RG-5/OQ-1 | **OPEN** tới khi thao tác và restore drill trên môi trường thực tế được kiểm chứng |

## Bằng chứng chạy trong phiên

| Kiểm tra | Kết quả đã đọc | Log/báo cáo |
|---|---|---|
| Backend baseline, ép chạy lại | 328 sự kiện test PASS; build thành công | `.logs/deploy-backend-test-fresh.log` |
| Backend sau hardening | **342 test, 0 failure/error/skipped**; `check`, Checkstyle và JaCoCo thành công | `.logs/deploy-backend-final.log`, `backend/build/test-results/test/TEST-*.xml` |
| FE unit tests | **316/316 PASS** | `.logs/deploy-web-test.log` |
| FE typecheck/lint sau sửa | Thành công | `.logs/deploy-web-typecheck-final.log`, `.logs/deploy-web-lint-final.log` |
| FE build | Thành công; cảnh báo chunk >500 kB vẫn giữ trong log | `.logs/deploy-web-build.log`, Docker build log |
| npm audit toàn bộ dependency FE | **0** info/low/moderate/high/critical | `.logs/deploy-npm-audit.json` |
| Gitleaks working tree | Không phát hiện secret theo bộ luật đang dùng | `.logs/deploy-gitleaks.log` |
| Gitleaks Git history | **53 commit**, không phát hiện secret | `.logs/deploy-gitleaks-history.log` |
| Trivy JAR baseline, DB cập nhật | **0 HIGH/CRITICAL** phát hiện; không suy rộng thành “không có mọi CVE” | `.logs/deploy-trivy-jar.json` |
| Docker final | Build thành công, JRE 21, non-root, đóng gói FE/BE | `.logs/deploy-docker-build-final.log` |
| Browser suite với API trên container riêng | **89/89 PASS**, gồm test production thật dưới CSP; khoảng 468 giây | `.logs/deploy-container-e2e.log` |
| Container 512 MiB / 1 CPU | Startup readiness **61,0 giây**, peak **369.356.800 byte (~352,2 MiB)**, không OOM, user `wander`; read-only/cap-drop/no-new-privileges | `.logs/deploy-container-smoke.log`, `.logs/deploy-container-metrics.json` |
| Image scan OS + Java, mọi severity | **0** phát hiện trong cả hai nhóm OS và Java được nhận diện bởi Trivy 0.76.1 | `.logs/deploy-image-report/report.json` |
| Secret scan cuối trên mọi sửa đổi/file mới thuộc deploy | Không phát hiện secret | `.logs/deploy-gitleaks-final-diff.log` |

`npm audit`/CVE scan chỉ phát hiện điều công cụ và cơ sở dữ liệu đã biết; không thay thế rà authorization hoặc threat model. Scanner baseline ban đầu của repo là Trivy 0.58.1; quét image dùng release 0.76.1 đã đối chiếu [release chính thức](https://github.com/aquasecurity/trivy/releases/tag/v0.76.1), không dùng tag `latest`. `tools/quality.ps1` và mẫu CI chưa kích hoạt được cập nhật sang 0.76.1 kèm digest; root Dockerfile ghim đúng ba base-image digest đã dùng trong bài scan/smoke, không tự lấy bản base khác khi deploy.

Image smoke có manifest index `sha256:275dc533318f4c0b2f8139844efa13a04ddf10edb9cf95467d53cbdd37939b6b`. Rebuild sau khi ghim digest dùng toàn bộ cache; config digest vẫn là `sha256:36fb664a2c213a0c8a6b61836c6da4aaffa136acce71ed71ab6e67e16e0dcfc5`, manifest runtime vẫn `sha256:5179eda6bfd1e146c28e8c622da1262e55f31d9a4f7ce7a64a658e8ff6ce0531`; chỉ provenance attestation/index đổi. Tag local hiện có index `sha256:24c92adb91cff3b86993f04f872350b0bbc1b7b640539b023a666700949257b1`; bằng chứng trong `.logs/deploy-docker-build-pinned.log`. Không nhầm index khác do provenance với việc đã kiểm một runtime khác.

Các container/database/network thử và file env tạm đã được script dọn sau test. Chưa có restore drill hay cấu hình TLS/proxy trên cloud; không suy rộng số đo local thành cam kết tải/uptime Render Free.

## Hai điểm reviewer còn nêu, không được bỏ qua

1. **Readiness không query DB sau startup — lựa chọn có chủ đích cho Neon Free.** Giữ `readinessState` để probe thường xuyên không làm DB mất khả năng ngủ. Điều này có nghĩa DB hỏng sau startup có thể khiến API lỗi trong khi probe vẫn UP. Dùng smoke API riêng khi deploy và theo dõi lỗi; không xem probe này là bằng chứng DB khỏe. Không tự thêm `db` vào probe chỉ để rồi hao quota liên tục.
2. **LOW: retry recovery đã commit sau khi retire khóa cũ.** Khi mã active đã được đổi sang khóa mới và operator gỡ khóa cũ, attempt committed cũ không còn xác minh được nên retry có thể trả `INVALID_REPLACEMENT`. Không cấp thêm phiên và không làm mất mã đang active. Không chuyển kiểm tra COMMITTED lên trước xác minh để che lỗi. Giữ khóa cũ trong thời gian cần hỗ trợ retry; chính sách retention/idempotency lâu dài còn cần quyết trước phát hành rộng.

Khoảng trống test reviewer nêu vẫn cần giữ: negative startup khi DB thật còn nhãn khóa bị bỏ mới được kiểm bằng mock repository; smoke hiện kiểm startup dương tính trên DB mới. Test rotation dùng digest khóa cũ thật và metadata v1 trong DB, chưa phải restore một bản DB người dùng trước V17 rồi nâng cấp. Race test chạy đồng thời thật nhưng chưa ép mọi interleaving; test write quota chưa bao phủ riêng nhiều session cùng identity và thời điểm đổi cửa sổ. Không dùng những test chưa chạy này làm bằng chứng đóng gate.

## Điều kiện cho bước cloud

- Kết nối Render và Neon trong tài khoản của PO; chỉ chọn Free. Không gửi credential trong chat, Git hay `VITE_*`.
- Tạo DB mới dành riêng demo; dùng JDBC TLS xác minh chứng chỉ/hostname, không bỏ verify để chữa lỗi CA.
- Giữ nguyên một instance; điền `WANDER_TRUSTED_PROXY_HOPS` chỉ sau khi xác minh đường proxy và thử header giả từ ngoài.
- Chốt source/commit dùng deploy, không gom `.mcp.json`, `.claude/settings.local.json` và các thư mục nghiên cứu chưa theo dõi vào commit deploy.
- Smoke HTTPS/domain thực, tạo danh tính/chuyến, ghép/khôi phục, map/CSP và dữ liệu sống qua redeploy; lưu kết quả theo commit.
- Hoàn tất nơi giữ pepper, backup và quy trình restore. Chưa coi demo online là đã đóng RG-2/5/6/7 hoặc được phát hành cho người dùng thật.

## Công cụ và giới hạn

PowerShell/ripgrep; hai reviewer chỉ đọc; Gradle/Testcontainers/PostgreSQL, TypeScript/ESLint/Stylelint/Node test, Playwright Chrome/Edge, npm audit, gitleaks, Trivy và Docker. Không có resource cloud nào được tạo ở thời điểm viết báo cáo này. Kết nối tài khoản đang chờ người dùng.
