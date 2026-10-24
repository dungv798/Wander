# Route — vòng 1

`route-hint` (đọc bảng trong `.claude/skills/wander-review/reference.md`) khớp dòng "Identity, ownership, auth, recovery (Q16, D15, A-0)".

| Agent | Chọn? | Vì sao |
|---|---|---|
| `wander-security-reviewer` | Có | Q16 là bài toán sở hữu, khôi phục, rò link/mã, lạm dụng: đúng chuyên môn |
| `wander-software-architect` | Có | So sánh ít nhất hai phương án ở mức khái niệm; khóa gì vào, đảo ngược được không, di chuyển 1a→1b |
| `wander-skeptic-qa` | Có | Thử kịch bản cụ thể (mất thiết bị, mất mã, khôi phục hai lần, xóa vĩnh viễn) và kiểm tra khuyến nghị có theo từ D15 không |
| `wander-product-analyst` | Không | Chỉ thêm khi phạm vi hoặc ranh giới 1a/1b bị nghi ngờ. §9.2 đã xếp Q16 vào 1a; điểm nối với 1b (Q7, Q16-8) do security-reviewer và architect đã bao trùm. Nếu bất đồng ở vòng 2 liên quan đến ranh giới, sẽ xem lại |

Mỗi agent nhận brief độc lập, không có kết luận của orchestrator.
