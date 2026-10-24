# Wander — quyết định triển khai, mặc định và release gate

> Bắt đầu 23/10/2026 theo chỉ đạo của Product Owner: tự chủ triển khai, mặc định trước, chỉ hỏi khi quyết định ảnh hưởng đáng kể (Tầng A, `.claude/rules/decision-materiality.md`). Master plan vẫn là nguồn sự thật cho yêu cầu; file này ghi **lựa chọn kỹ thuật** và **mặc định** mà master plan để mở.
> Cập nhật 24/10/2026: PO chọn stack Java (ADR-002). Backend được viết lại; hợp đồng API giữ nguyên.

## 1. Stack
| ADR | Nội dung | Trạng thái |
|---|---|---|
| ADR-001 | TypeScript trên Node, `node:http`, SQLite (agent tự chọn 23/10, **không hỏi PO**) | `SUPERSEDED` bởi ADR-002 |
| [ADR-002](../architecture/adr/ADR-002-java-spring-stack.md) | Java 21 · Spring Boot 4 · Clean Architecture · DDD · CQRS · modular monolith · JPA/Hibernate · PostgreSQL · AWS · giao diện TypeScript (React + Vite) | `APPROVED` (PO, 24/10/2026) |
| [ADR-004](../architecture/adr/ADR-004-java21-spring-boot-4.md) | Java 21 + Spring Boot 4.1 (AD-11) | `APPROVED` (PO, 24/10/2026) |
| [ADR-003](../architecture/adr/ADR-003-modules-layers-cqrs.md) | Module `identity`/`planning`, tầng domain/application/infrastructure/api, CQRS cùng DB, khóa lạc quan | `PROPOSED` |

Quyết định kỹ thuật còn chờ PO: `docs/architecture/open-decisions.md` (AD-1…AD-11).

Cấu trúc: `backend/` (Java), `web/` (React + TypeScript), `e2e/` (trình duyệt thật), `legacy/ts-server/` (server TypeScript cũ, chỉ để tham chiếu hợp đồng API — AD-10), `tools/dev.ps1` (lệnh Windows).

## 2. Mặc định đã chọn cho phần plan để mở (Tầng B: chọn và ghi lại, không hỏi)
| Mục | Plan | Mặc định của implementation | Trạng thái |
|---|---|---|---|
| Q11 tùy chọn khi tạo chuyến | ❓ | Không làm (khớp 🔶 P6: không thuộc Must) | DEFERRED |
| P13 Task | 🔶 một phần | Làm loại mục "Việc cần làm" có ô tích; "tạo nhanh" chưa làm | DEFAULTED / DEFERRED |
| P2/R12 đổi ngày làm mục nằm ngoài khoảng | 🔶 | Chặn đổi (409) cho đến khi chuyển hoặc xóa vĩnh viễn mục đó; **tính cả mục đã xóa mềm** để khôi phục không tạo mục mồ côi | DEFAULTED |
| P5 hoàn thành theo (việc × người) | 🔶 | Bảng `item_completions(item_id, person_id)`; 1a person = danh tính chủ | DEFAULTED |
| Q17a phạm vi Hoàn tác | ❓ | Chỉ hoàn tác thao tác xóa (= khôi phục); không hoàn tác sửa (khớp "không có lịch sử chỉnh sửa") | DEFAULTED |
| Q17b xóa mềm cả chuyến | ❓ | Chưa có thao tác xóa chuyến. D25 (xác thực lại cho xóa vĩnh viễn cả chuyến) chưa áp dụng | DEFERRED |
| Q17c xóa vĩnh viễn | ❓ | Chỉ chủ chuyến, chỉ với mục đã ở "Đã xóa gần đây", từng mục một | DEFAULTED |
| Q18a thứ tự thủ công ≠ thứ tự giờ | ❓ | Cho phép, không cảnh báo | DEFAULTED |
| Q18b giờ + thời lượng qua nửa đêm | ❓ | Cho phép; mục thuộc ngày được chọn (R6) | DEFAULTED |
| Q18c cờ "giờ ước chừng" (A-15) | ❓ | Chưa làm | DEFERRED |
| Q18d số thập phân, giá trị tối đa | ❓ | Số thập phân là định dạng sai; tối đa 1.000.000.000 nghìn đồng | DEFAULTED |
| Q18e ký hiệu VND | ❓ | `1.500.000 ₫` (định dạng `vi-VN`) | DEFAULTED |
| Q18f vừa có chi phí vừa tick "đã bao gồm" | ❓ | Cho phép lưu cả hai; tổng bỏ qua mục đã bao gồm; giá tham khảo chỉ khi đã tick, bỏ tick thì xóa giá tham khảo | DEFAULTED |
| Độ dài chuyến, tiêu đề, ghi chú, thời lượng | không nói | Tối đa 366 ngày, tên chuyến 120 ký tự, tiêu đề mục 200, ghi chú 2000, thời lượng ≤ 7 ngày | DEFAULTED |
| Giới hạn tần suất | D15/Q16(6) | Tạo danh tính 30/giờ/địa chỉ; khôi phục/ghép 30/giờ/địa chỉ; duyệt 20/giờ/phiên (bộ nhớ, một tiến trình); đổi bằng `WANDER_LIMIT_*` | DEFAULTED |
| Sửa đồng thời cùng chuyến (chuẩn bị Q8) | ❓ (1b) | Khóa lạc quan theo chuyến: lệnh sau nhận 409 `CONCURRENT_MODIFICATION` | DEFAULTED |
| Cổng PostgreSQL cục bộ | — | `5433` (tránh đụng PostgreSQL cài sẵn) | DEFAULTED |

## 3. Release gate
| ID | Nội dung | Trạng thái |
|---|---|---|
| RG-1 | **Q16 chưa được duyệt** (bản thiết kế `docs/autopilot/q16-design-draft.md`). Có thể phát triển module khôi phục theo D20–D26 và các mặc định MĐ-1…MĐ-8, nhưng **không phát hành cho người dùng thật** cho đến khi PO duyệt thiết kế | Mở |
| RG-2 | G7 vẫn `UNVERIFIED`: cần mô hình đe dọa, tiêu chí "an toàn" đo được, test INV/NEG có kết quả, kiểm tra với người dùng thật | Mở |
| RG-3 | Q6, Q7, Q8 (1b): chia sẻ, link mời, sửa đồng thời. Không thuộc 1a, chưa làm | Hoãn |
| RG-4 | Replay test A-12 (nhập chuyến thật 64 mục từ file Excel, mở trên thiết bị khác, đo theo §10.5) cần PO tham gia | Mở |
| RG-5 | **Chưa sẵn sàng triển khai**: chưa chọn dịch vụ AWS (AD-2/AD-3), giới hạn tần suất theo địa chỉ sai khi chạy sau load balancer (AD-6), chưa có sao lưu và chính sách giữ dữ liệu (OQ-1). Đề xuất: `docs/architecture/aws-deployment.md` | Mở |
| RG-6 | Bí mật phiên lưu trong `localStorage` (XSS là rủi ro còn lại). Cookie `HttpOnly` / Spring Security: AD-1 | Mở |
| RG-7 | Giao diện mới được kiểm tra tự động trên Edge (khung nhìn điện thoại giả lập), chưa thử trên thiết bị thật, Safari/Firefox, trình đọc màn hình hay mạng yếu (Q15) | Mở |

## 4. Quyết định giao diện (mặc định, đảo ngược được)
- Sắp xếp bằng nút Lên/Xuống (không kéo thả) để dùng được trên mọi thiết bị; kéo thả có thể thêm sau.
- Thêm mục: nút "+ Thêm mục" → gõ tiêu đề → Enter (A-3, thêm liên tiếp được); chi tiết là tùy chọn.
- Khi tạo danh tính, giao diện đưa người dùng qua luồng hai pha (tạo mã → hiển thị một lần → nhập lại để xác nhận) hoặc "Bỏ qua" kèm cảnh báo (D26).
- Hoàn tác = nút trong thông báo 8 giây sau khi xóa; sau đó mục nằm ở "Đã xóa gần đây" cho đến khi xóa vĩnh viễn (D19).
- Chi phí nhập bằng nghìn đồng, có gợi ý "150 = 150.000 ₫" ngay trong ô.

## 5. Chạy và kiểm tra (Windows, PowerShell)
Cần: JDK 21 (Gradle tự tải nếu thiếu), Docker Desktop đang chạy, Node ≥ 24, Edge hoặc Chrome.
```
powershell -ExecutionPolicy Bypass -File tools\dev.ps1 doctor         # kiểm tra công cụ
powershell -ExecutionPolicy Bypass -File tools\dev.ps1 backend-test   # JUnit + ArchUnit + Testcontainers PostgreSQL
powershell -ExecutionPolicy Bypass -File tools\dev.ps1 e2e            # backend Java + giao diện + 4 kịch bản trình duyệt
powershell -ExecutionPolicy Bypass -File tools\dev.ps1 verify         # tất cả, kèm kiểm tra RTK và code-review-graph
powershell -ExecutionPolicy Bypass -File tools\dev.ps1 run            # http://127.0.0.1:8787 (API + giao diện web/dist)
npm --prefix web run dev                                              # giao diện dev: http://localhost:5173, proxy /api → 8787
```
Mỗi lệnh ghi `.logs\<lệnh>.log` và `.logs\<lệnh>.status` (PASS/FAIL). Kết quả lần chạy gần nhất: mục 6.

## 6. Tiến độ (cập nhật 24/10/2026)
| Hạng mục | Trạng thái |
|---|---|
| Chuyển backend sang Java (ADR-002), giữ nguyên hợp đồng `/api/*` | Xong. `tools\dev.ps1 verify` 24/10/2026 08:24 trên máy PO (Windows, JDK 21, Docker 29.9.2): **83/83 test backend** (ArchUnit 7, domain 23, API tích hợp PostgreSQL 53) + **4/4 e2e** trên Edge với backend Java — PASS |
| A-1…A-11, A-13, A-16 | Có trên backend Java; `PlanningApiIT` 25/25 + e2e |
| A-0 (danh tính ẩn danh, lưu server, mở trên thiết bị khác) | Có theo D15, D20–D26 và bản thiết kế nháp (`RecoveryApiIT` 24/24, `RateLimitIT` 1/1); **chờ duyệt thiết kế (RG-1)** |
| A-12 (Replay) | Chưa chạy (RG-4) |
| A-14, A-15, A-17, A-18 | Chưa làm: phụ thuộc Q14/Q18c hoặc là Could |
| 1b (chia sẻ, link mời, quyền) | Chưa làm, phụ thuộc Q6/Q7/Q8 |
| Công cụ AI | RTK 1.0.1 (hook toàn cục Claude Code), code-review-graph 2.3.9 (MCP `.mcp.json`, 111 file đã index) — `tools-check` PASS |
