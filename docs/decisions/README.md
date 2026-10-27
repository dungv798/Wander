# Bản ghi quyết định sản phẩm (DR)

Nơi ghi các quyết định **sản phẩm** PO chốt sau khi master plan được viết (ví dụ qua `/wander-council Q17 …`), khi PO **không** yêu cầu sửa thẳng `docs/wander-master-plan.md`. Quyết định kỹ thuật đi vào ADR ở `docs/architecture/adr/`.

- Tên file: `DR-<số>-<slug>.md` (ví dụ `DR-001-xoa-ca-chuyen.md`). Số do phiên ghi lần lượt; mã D-số trong plan chỉ PO đặt khi đưa vào plan.
- Một bản ghi chỉ có hiệu lực khi trạng thái là `APPROVED` kèm ngày và câu trả lời của PO. Bản phân tích chưa được trả lời giữ ở `OPEN`.
- Plan vẫn là nguồn sự thật: nếu DR mâu thuẫn với plan, ghi `CONTRADICTION` và hỏi PO, không tự sửa plan.

Mẫu:

```markdown
# DR-00n — <tiêu đề> (<Q-id>)

- **Trạng thái:** `APPROVED` — PO chọn "<nguyên văn>" ngày dd/mm/yyyy.
- **Liên quan:** <D-/R-/A- ID>, <gate>

## Quyết định
## Phương án đã cân nhắc (vì sao không chọn)
## Hệ quả (việc cần làm, test cần thêm)
```
