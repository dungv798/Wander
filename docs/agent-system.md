# Hệ thống agent cho Wander

Hướng dẫn dùng bộ agent và skill của Claude Code cho Wander: **review planning**, **ra quyết định kiến trúc cùng PO** và **làm/rà code** trên stack đã duyệt (ADR-002). Agent không ra quyết định sản phẩm hay kiến trúc; PO quyết.

> **Cập nhật 24/10/2026 — xem mục 12** (stack Java đã duyệt, quy tắc hỏi theo Tầng A/B/C, agent và skill mới).

> Phiên bản cấu hình khớp với `docs/wander-master-plan.md` **v0.3**. Kiểm tra lại nếu kế hoạch đổi phiên bản (xem `.claude/rules/wander-product-context.md`).

## 1. Kiến trúc

```
Bạn ──► Phiên Claude Code chính (điều phối + trọng tài)
            │  đọc đúng các mục cần thiết của kế hoạch
            ├──► wander-product-analyst     (phạm vi, luồng, tiêu chí nghiệm thu)
            ├──► wander-software-architect  (mô hình dữ liệu, phương án kỹ thuật)
            ├──► wander-security-reviewer   (danh tính, khôi phục, quyền)
            ├──► wander-skeptic-qa          (phản biện, ca biên, mâu thuẫn, thiếu test)
            └──► wander-code-reviewer       (rà code Java/TS theo checklist, dùng code-review-graph)
```

- Phiên chính là **orchestrator và trọng tài cuối**. `/wander-autopilot` chỉ dùng 4 agent planning; `wander-code-reviewer` dùng trong `/wander-feature` và `/wander-review` (code).
- Bốn agent chuyên môn **chỉ đọc** (`tools: Read, Grep, Glob`), không có Bash, không ghi file, không có công cụ `Agent` nên **không tự gọi agent khác**.
- Mỗi agent chạy trong ngữ cảnh riêng, chỉ trả về báo cáo ngắn theo cùng một mẫu 9 mục.
- Mọi quyết định sản phẩm thuộc về bạn. Agent chỉ đưa khuyến nghị.

## 2. Các file nằm ở đâu

| Mục đích | Đường dẫn |
|---|---|
| Ngữ cảnh chung, ngắn | `CLAUDE.md` |
| Bản đồ mục của kế hoạch + trạng thái đã xác minh | `.claude/rules/wander-product-context.md` |
| Ranh giới an toàn | `.claude/rules/planning-safety.md` |
| Mẫu báo cáo + nhãn phân loại | `.claude/rules/review-output.md` |
| 4 agent | `.claude/agents/wander-*.md` |
| 3 skill | `.claude/skills/wander-review/` (kèm `reference.md`), `wander-decision-audit/`, `wander-spec-review/` |
| Quyền (chặn sửa kế hoạch, chặn đọc `.env`) | `.claude/settings.json` |
| Kế hoạch tổng thể (nguồn sự thật, **không sửa**) | `docs/wander-master-plan.md` |

## 3. Gọi agent

Dùng khi bạn cần **một góc nhìn** (rẻ hơn gọi cả nhóm):

- Trong phiên Claude Code: `@agent-wander-security-reviewer rà soát rủi ro khi chủ chuyến mở chuyến trên thiết bị mới (D15, Q16)`
- Hoặc nói tự nhiên: "Dùng subagent wander-software-architect so sánh hai hướng cho Q16, đừng chọn hướng nào."
- Chạy cả phiên với một agent: `claude --agent wander-skeptic-qa`

| Agent | Dùng khi |
|---|---|
| `wander-product-analyst` | Phạm vi, luồng người dùng, tiêu chí nghiệm thu, phụ thuộc 1a/1b, phân loại câu hỏi mở (Q11, P13…) |
| `wander-software-architect` | So sánh phương án mô hình dữ liệu, thứ tự mục, chi phí, xóa mềm, di chuyển 1a→1b |
| `wander-security-reviewer` | Danh tính ẩn danh, khôi phục quyền, rò link/mã, quyền thành viên ở 1b |
| `wander-skeptic-qa` | Phản biện một đề xuất, ca biên (qua nửa đêm, trống/0/đã bao gồm, xóa/khôi phục), ước tính |

## 4. Gọi skill

Các skill chỉ chạy khi bạn gõ lệnh (đã tắt tự kích hoạt để không tốn ngữ cảnh):

| Lệnh | Việc làm |
|---|---|
| `/wander-review <mục tiêu hẹp>` | Review nhiều góc nhìn có giới hạn: song song một vòng + tối đa một vòng phản biện, rồi báo cáo hợp nhất |
| `/wander-decision-audit <đề xuất/câu cần kiểm>` | Truy nguồn từng mệnh đề, tìm mâu thuẫn, soạn bản ghi quyết định để bạn duyệt. Không dùng agent con |
| `/wander-spec-review <đường dẫn spec>` | Review spec Lát 1a/1b trước khi code: blocker, vấn đề quan trọng, vấn đề nhỏ, câu hỏi mở |

## 5. Ví dụ: review Q16

```
/wander-review Q16: thiết kế xác thực và khôi phục quyền chủ chuyến (D15)
```

Điều xảy ra: orchestrator đọc §7.4 (R13), §9.1 (A-0), §14.1 (D15), §15.1 (Q16), §12; gọi song song `wander-security-reviewer`, `wander-software-architect`, `wander-skeptic-qa`; nếu có bất đồng đáng kể thì chạy **một** vòng phản biện nhắm đúng agent liên quan; rồi trả báo cáo kết thúc bằng danh sách điều **bạn** cần quyết. Không file nào bị đổi.

## 6. Prompt mẫu (copy-paste)

1. **Review một quyết định chưa chốt**
   ```
   @agent-wander-product-analyst Phân loại Q11 và P13 theo kế hoạch: đã quyết gì, chưa quyết gì, mỗi đáp án sẽ làm thay đổi điều gì. Đừng chọn hộ tôi.
   ```
2. **Review đa agent có giới hạn**
   ```
   /wander-review Mô hình chi phí Q3/Q4 (D17, D18, R2–R4) và ánh xạ 32 ô "—" trong chuyến thật
   ```
3. **Review spec trước khi code**
   ```
   /wander-spec-review docs/slices/lat-1a.md
   ```
4. **Nhờ orchestrator so sánh các khuyến nghị mâu thuẫn**
   ```
   Hai báo cáo vừa rồi (architect và security) bất đồng về phương án khôi phục. Hãy lập bảng bất đồng: ai nói gì, bằng chứng nào, bằng chứng nào sẽ phân xử. Chỉ gọi lại đúng hai agent đó, tối đa một vòng, rồi dừng và hỏi tôi.
   ```

## 7. Thêm agent mới một cách an toàn

1. Tạo `.claude/agents/<ten>.md` với `name` khớp tên file, `description` nêu rõ khi nào dùng/không dùng.
2. Mặc định `tools: Read, Grep, Glob`. Không thêm `Bash`, `Edit`, `Write`, `Agent`, `WebFetch` nếu chưa có lý do ghi rõ và bạn đồng ý.
3. Không đặt `permissionMode: bypassPermissions`; không thêm `hooks`.
4. Trong thân agent: vai trò, những việc **không được làm**, và "tuân theo `.claude/rules/review-output.md`". Đừng chép lại kế hoạch.
5. Thêm một dòng vào bảng định tuyến trong `.claude/skills/wander-review/reference.md`, rồi chạy kiểm tra ở mục 9.

## 8. Giữ ngữ cảnh và token gọn

- `CLAUDE.md` và 3 rule rất ngắn; bản đồ mục giúp agent chỉ đọc đúng phần cần.
- Skill tắt tự kích hoạt: tên và mô tả của chúng không chiếm ngữ cảnh mỗi lượt.
- Chỉ gọi agent cần thiết (bảng định tuyến). Câu hỏi nhỏ dùng `/wander-decision-audit` hoặc một agent.
- Giới hạn cứng: một vòng song song + tối đa một vòng phản biện; agent con không gọi thêm agent; `maxTurns: 16`.
- Đánh đổi thật: chạy song song với ngữ cảnh tách biệt giúp các góc nhìn **độc lập** nhưng thường tốn **nhiều token tổng cộng hơn** một lượt đọc đơn. Mức tiết kiệm không được cam kết; xem số đo ở báo cáo kiểm tra (nếu có) thay vì phỏng đoán.
- Mỗi agent chạy theo model của phiên (`model: inherit`) và `effort: medium`. Có thể đổi trong frontmatter nếu muốn rẻ hơn, đổi lại có thể giảm chất lượng.

## 9. Kiểm tra hệ thống

- Cấu trúc: chạy script kiểm tra frontmatter/đường dẫn (xem báo cáo kiểm tra) hoặc mở `/agents` trong Claude Code để thấy bốn agent.
- Hành vi: chạy lại năm bài thử mô tả ở mục "Bài thử hành vi" của `docs/agent-system-validation.md` (mỗi bài vài chục xu USD theo giá niêm yết; xem số đo trong file đó).
- An toàn: kế hoạch không đổi, đối chiếu băm sha256 ghi trong `.claude/rules/wander-product-context.md`:
  `sha256sum docs/wander-master-plan.md` (Windows PowerShell: `Get-FileHash docs\wander-master-plan.md -Algorithm SHA256`).

## 10. Giới hạn đã biết và điều cố ý không tự động

- Quyền chỉ đọc của agent con là **cơ chế thật** (allowlist công cụ). Phiên chính vẫn có Bash/Edit theo quyền thường; `deny` trên `Edit(/docs/wander-master-plan.md)` chặn công cụ sửa file nhưng **không chặn mọi lệnh Bash** (ví dụ chuyển hướng ghi). Đừng chạy phiên chính ở chế độ bỏ qua quyền.
- Agent teams (nhắn tin trực tiếp giữa agent) **không được dùng**; hệ thống không phụ thuộc vào chúng. Phản biện chạy qua orchestrator.
- Quy tắc trong `CLAUDE.md` và rule là chỉ dẫn cho model, không phải rào chắn cứng. Rào chắn cứng chỉ gồm `tools` của agent và `permissions.deny`.
- Bản đồ trạng thái trong rule là bản sao đã xác minh theo v0.3; nếu kế hoạch đổi, phải xác minh lại (có băm sha256 để phát hiện).
- Không tự động: sửa kế hoạch, duyệt quyết định, chạy review định kỳ, lưu báo cáo, lặp review khi có thay đổi nhỏ, tạo spec, viết code.

## 11. /wander-autopilot (chạy trọn một mục tiêu, có thể tiếp tục)

Một lệnh thay cho chuỗi prompt thủ công: `/wander-autopilot <mục tiêu hẹp>`; xem trước bằng `dry-run <mục tiêu>`; tiếp tục bằng `resume`. Dùng lại 4 agent và bảng định tuyến của `/wander-review`; thêm máy trạng thái (`.claude/scripts/autopilot.mjs`) và hook chặn cứng (`.claude/hooks/autopilot-guard.mjs`). Hướng dẫn đầy đủ, giới hạn và cách khởi động: `docs/autopilot/README.md`.

- Không sửa kế hoạch, không viết code, không nâng đề xuất thành quyết định; kết quả mỗi lần chạy nằm trong `docs/autopilot/runs/<run-id>/`.
- Tối đa 2 vòng review (khớp quy tắc 7 trong `planning-safety.md`), tối đa 8 lần gọi agent, giới hạn thử lại và resume được ép bằng mã.
- Hook PreToolUse và `permissions.allow` hẹp được thêm vào `.claude/settings.json`. Hook nằm ở cấp dự án; 4 agent vẫn không có hook riêng (mục 7). Hook chỉ **hạn chế**, không bao giờ cấp quyền.


## 12. Cập nhật 24/10/2026 — workflow mới

**Vấn đề cũ:** agent tự chọn stack (TypeScript/SQLite, ADR-001) mà không hỏi, trong khi báo cáo đầy câu hỏi vụn (dấu thập phân, ký hiệu ₫). **Sửa:**

| Thay đổi | File |
|---|---|
| Stack do PO chọn: Java/Spring Boot, Clean Architecture, DDD, CQRS, JPA/Hibernate, PostgreSQL, AWS, giao diện TypeScript | `docs/architecture/adr/ADR-002-java-spring-stack.md` |
| Quy tắc hỏi theo mức ảnh hưởng: **Tầng A** (stack, kiến trúc, thư viện mới, bảo mật, AWS/chi phí, khó đảo ngược) → hỏi PO, có phương án + khuyến nghị + "học được gì"; **Tầng B** → tự chọn, ghi `decisions.md`; **Tầng C** → làm luôn | `.claude/rules/decision-materiality.md` |
| Hàng đợi quyết định kỹ thuật AD-1…AD-11 | `docs/architecture/open-decisions.md` |
| Agent kiến trúc viết lại: biết stack, nhìn theo system design, phân tầng câu hỏi, giải thích để học | `.claude/agents/wander-software-architect.md` |
| Agent mới rà code: checklist 9 điểm, xếp BLOCKER/MAJOR/MINOR/NIT, "điểm tốt đáng học" | `.claude/agents/wander-code-reviewer.md` |
| 3 agent còn lại: thêm lọc Tầng A/B; security và QA đọc được code | `.claude/agents/*.md` |
| Skill `/wander-architecture-decision <AD-x hoặc câu hỏi>`: chuẩn bị phương án → hỏi PO → ghi ADR | `.claude/skills/wander-architecture-decision/` |
| Skill `/wander-feature <story>`: truy nguồn → hỏi Tầng A → thiết kế → code → test thật trên Windows → rà code → ghi lại → "học được gì" | `.claude/skills/wander-feature/` |
| Công cụ: RTK (proxy giảm token cho lệnh shell, hook toàn cục) và code-review-graph (đồ thị code qua MCP, `.mcp.json`; hook cập nhật đồ thị sau mỗi lần sửa) | `CLAUDE.md` mục "Tooling" |

Ghi chú `.claude/settings.json`: `code-review-graph install` đã ghi đè file này (nó không đọc được JSON có chú thích `//`); đã gộp lại quyền cũ + hook autopilot (vẫn tắt bằng `"matcher": "NONE"` như trước — dòng chú thích gốc `Write|Edit|MultiEdit|NotebookEdit|Bash|PowerShell|Agent|Task` là matcher để bật lại) + hook của code-review-graph. Không thêm chú thích `//` vào file này nữa.
