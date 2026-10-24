# Báo cáo kiểm tra hệ thống agent (23/10/2026)

Phạm vi: chỉ hạ tầng agent. Không kiểm tra tính đúng của nội dung sản phẩm.

## Môi trường và tài liệu
- Claude Code CLI **2.1.309** (chạy trong container có sẵn, đã đăng nhập). Máy của bạn là Windows; các file được chép sang `D:\Wander`, **chưa chạy Claude Code trên máy bạn**.
- Tài liệu chính thức đã đọc ngày 23/10/2026 (phần đầu trang; mỗi trang bị cắt ở khoảng 100.000 ký tự):
  - https://code.claude.com/docs/en/sub-agents
  - https://code.claude.com/docs/en/skills
  - https://code.claude.com/docs/en/memory
  - https://code.claude.com/docs/en/settings
  - https://code.claude.com/docs/en/permissions
- Tính năng dùng: subagent trong `.claude/agents/` (`tools`, `model`, `effort`, `maxTurns`, `color`), skill trong `.claude/skills/` (`disable-model-invocation`, `allowed-tools`, `argument-hint`), `CLAUDE.md`, `.claude/rules/`, `permissions.deny`.
- Không dùng: agent teams, hooks, `permissionMode`, MCP, plugin, framework ngoài.

## Kiểm tra cấu trúc (script đọc frontmatter bằng PyYAML)
Kết quả: **87 PASS, 0 FAIL** (lần chạy cuối, sau khi đã có đủ file). Script kiểm: tên khớp tên file/thư mục, `tools` đúng `Read, Grep, Glob`, không có `Agent`, không `permissionMode`, `maxTurns` có giới hạn, chỉ dùng trường có trong tài liệu, mô tả skill < 1.536 ký tự, `SKILL.md` < 500 dòng, đường dẫn tham chiếu tồn tại, `settings.json` hợp lệ và chặn sửa kế hoạch, băm sha256 trong rule khớp kế hoạch, D15–D19 và Q16–Q18 có trong kế hoạch.
Giới hạn: PyYAML không phải trình kiểm của Claude Code; các trường lạ bị Claude Code **bỏ qua im lặng**, nên script cũng kiểm danh sách trường được phép.

## Bài thử hành vi
Chạy bằng `claude -p` với `--setting-sources project` (không nạp cấu hình người dùng), trong một bản sao có Git, mỗi bài có trần chi phí. Bài A–D chạy agent làm luồng chính bằng `--agent <tên>` (kiểm định nghĩa agent, quyền công cụ và việc nạp `CLAUDE.md`/rule). **Chúng không kiểm đường ủy quyền**; bài E kiểm đường đó.

| Bài | Lệnh/Prompt (rút gọn) | Kết quả quan sát | Số đo (CLI báo, giá niêm yết) |
|---|---|---|---|
| A | `wander-product-analyst`: phân loại Q16, Q17, Q18 | **PASS.** Cả ba `OPEN`; tách phần `APPROVED` (D15, D16–D19) khỏi phần chưa chốt; mẫu 9 mục; số dòng trích khớp kế hoạch | 3 lượt, ~0,11 USD |
| B | `wander-software-architect`: so sánh hai hướng cho Q16 | **PASS.** Hai phương án (bí mật mang theo / kênh khôi phục tùy chọn), đánh đổi, giả định, câu hỏi; đánh dấu `PROPOSED`, khuyến nghị "chưa nên chọn" | ~0,09 USD |
| C | `wander-security-reviewer`: rủi ro sở hữu ẩn danh đa thiết bị | **PASS.** 9 kịch bản có mức độ, không khẳng định cơ chế nào đã có; nêu rõ chưa đọc hết Q16 | ~0,10 USD |
| D | `wander-skeptic-qa`: phản biện giải pháp mẫu "mã khôi phục dùng một lần" | **PASS.** Kịch bản cụ thể (mất mã, lộ mã, khôi phục lần hai, xóa vĩnh viễn), không bịa mâu thuẫn ("không phát hiện CONTRADICTION, chỉ có khoảng trống") | ~0,09 USD |
| E | `/wander-review Q16 …` | **PASS với ghi chú.** 3 agent (security, architect, skeptic) gọi **song song trong một lượt**; không round 2 (có giải thích lý do); bất đồng được giữ nguyên dạng bảng; 7 bản ghi quyết định `DR-1…DR-7` ở dạng khuyến nghị; kết thúc bằng ranh giới phê duyệt; số dòng agent trích được orchestrator kiểm lại và khớp | 1 lần chạy: 22.041 token đầu ra, 608.800 token đọc cache, **~0,59 USD** cho toàn bộ (orchestrator + 3 agent) |

Ghi chú về bài E:
- Agent con chỉ dùng `Read` (6) và `Grep` (6). Không có `Edit`/`Write`/`Bash`/`Agent` trong ngữ cảnh agent con.
- Phiên chính dùng `Bash` 4 lần để đọc kế hoạch (`sed`, `grep`, `sha256sum`). Không ghi file. Sau đó mình thêm một dòng giới hạn vào `SKILL.md` ("đọc bằng Read/Grep/Glob"); **thay đổi này chưa chạy lại bài E**.
- Mới chạy 1 lần mỗi bài; chưa đo độ lặp lại hoặc phương sai.
- Số tiền là ước tính theo giá niêm yết do CLI báo, không phải hóa đơn gói thuê bao của bạn. Không có số liệu so sánh "tiết kiệm token" nào được khẳng định.

## Thử chủ động quyền chặn sửa kế hoạch (`.claude/settings.json`)
Chạy ở chế độ `acceptEdits` (tức là chỉ luật `deny` mới ngăn được):
- `Edit` lên `docs/wander-master-plan.md` → bị công cụ từ chối ("File is in a directory that is denied by your permission settings"). **PASS.**
- `Write` ghi đè cùng file → bị từ chối với thông báo tương tự. **PASS.** (Lần thử đầu model tự dừng nên mình thử lại với yêu cầu rõ ràng.)
- `Edit` lên một file khác trong `docs/` → thành công, nên luật không chặn nhầm cả thư mục. **PASS.**
- sha256 của kế hoạch không đổi sau cả ba lần thử.
Giới hạn: luật chặn công cụ sửa file, **không** chặn lệnh Bash (ví dụ chuyển hướng ghi) ở phiên chính; chưa thử và không khẳng định.

## Xác minh an toàn sau bài thử
- `git status` trong bản sao thử: chỉ có file mới của hạ tầng (`.claude/`, `CLAUDE.md`, `docs/agent-system*.md`); `git diff` rỗng; sha256 của `docs/wander-master-plan.md` vẫn `091f166b…2e04f0` (trùng bản v0.3 bạn gửi).
- Không có quyết định nào bị đổi trạng thái: Q16–Q18 vẫn `OPEN` trong mọi báo cáo.
- Không có bí mật hay biến môi trường trong báo cáo.
- Không có vòng ủy quyền: 3 lệnh `Agent` từ phiên chính, 0 từ agent con.

## Không kiểm hoặc chưa kiểm
- `/wander-decision-audit` và `/wander-spec-review`: **NOT RUN** (chỉ kiểm cấu trúc). Chưa có spec Lát 1a để review.
- Round 2 của `/wander-review`: chưa quan sát được vì bài E không cần.
- Chạy trên Windows/máy bạn: chưa.
- `permissions.deny` với lệnh Bash ghi vào kế hoạch: chưa thử.
