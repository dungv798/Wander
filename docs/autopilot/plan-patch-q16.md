# Đề xuất vá master plan — ghi nguyên tắc A và quyết định Q16

> **Cần áp dụng thủ công.** `docs/wander-master-plan.md` bị chặn sửa bởi quy tắc `permissions.deny` (`Edit(/docs/wander-master-plan.md)`) và hook `autopilot-guard`; các biện pháp này được giữ nguyên. File này liệt kê chính xác các thay đổi. Nguồn quyết định: hội thoại 23/10/2026, chi tiết thiết kế ở `docs/autopilot/q16-design-draft.md` (mục 0.1).
> Số hiệu D20–D26 là **số hiệu dự kiến**, chưa tồn tại trong plan (`UNVERIFIED` cho đến khi áp dụng). Chỉ các dòng này thành ✅ khi bạn áp dụng patch. Q16 và G7 **không** đổi trạng thái.

## 1. Header (dòng 3)
Thay:
`> **Phiên bản:** v0.3 (bản nháp, đã cập nhật theo quyết định Q1–Q5) · **Cập nhật:** 23/10/2026`
bằng:
`> **Phiên bản:** v0.4 (bản nháp, đã cập nhật theo quyết định Q1–Q5 và hướng thiết kế Q16) · **Cập nhật:** 23/10/2026`

## 2. §0 — thêm nhật ký thay đổi (chèn ngay trước dòng "**Thay đổi từ v0.2 sang v0.3 (đối chiếu quyết định Q1–Q5):**")
```
**Thay đổi từ v0.3 sang v0.4 (hướng thiết kế Q16):**
1. Ghi 7 quyết định mới (**D20–D26**) ở §14.1: nguyên tắc khôi phục, hướng bằng chứng, phạm vi mã, vòng đời mã, luồng khôi phục, xác thực lại, hiển thị mã.
2. **Q16 vẫn ❓ và G7 vẫn 🧪.** Bản thiết kế chi tiết (`docs/autopilot/q16-design-draft.md`) chưa được duyệt; blocker §15.6 mục 1 chưa đóng.

```

## 3. §14.1 — thêm 7 dòng sau dòng D19
```
| **D20** | **Nguyên tắc khôi phục:** không khôi phục quyền chủ chuyến nếu người yêu cầu không chứng minh được quyền sở hữu bằng bằng chứng được hệ thống chấp nhận; chấp nhận khả năng mất quyền truy cập vĩnh viễn khi mất mọi bằng chứng hợp lệ. Mã khôi phục hợp lệ là đủ làm bằng chứng; không thêm yếu tố khôi phục thứ hai bắt buộc | Chi tiết thiết kế: `docs/autopilot/q16-design-draft.md` (chờ duyệt) |
| **D21** | **Hướng bằng chứng ở Lát 1a:** mã khôi phục tự lưu + thiết bị tin cậy duyệt thiết bị mới. **Không** triển khai kênh liên hệ (email, số điện thoại) ở 1a | Mở rộng D15; không đổi D8, D14 |
| **D22** | **Một danh tính chủ có thể sở hữu nhiều chuyến; mỗi danh tính có một mã khôi phục dùng chung cho mọi chuyến của danh tính đó** | |
| **D23** | **Mã khôi phục dùng một lần. Tái tạo mã cần phiên chủ còn hiệu lực. Khôi phục không tự động thu hồi mọi phiên khác** | |
| **D24** | **Khôi phục phải thiết lập và xác nhận mã thay thế mới hoàn tất; không được bỏ qua. Mã cũ còn hiệu lực cho đến khi mã thay thế được xác nhận và ghi bền** | |
| **D25** | **Xác thực lại bằng bằng chứng được chấp nhận** trước khi xóa vĩnh viễn cả chuyến, tái tạo mã hoặc chuyển giao chủ. Không áp dụng cho xóa mềm hay xóa từng mục | Áp dụng nếu thao tác tồn tại (❓ Q17, Q16 câu 7). Loại bằng chứng xác thực lại: 🔶 trong bản thiết kế |
| **D26** | **Hiển thị mã khôi phục một lần khi tạo danh tính; cho phép bỏ qua nhưng phải cảnh báo rõ rằng mất mọi bằng chứng hợp lệ có thể dẫn đến mất quyền vĩnh viễn** | Câu chữ và giao diện: chưa chốt |
```

## 4. §7.1 — dòng "Danh tính ẩn danh" (cột Trạng thái)
Thay `| 1a | ✅ D15 · ❓ cơ chế (Q16) |` bằng `| 1a | ✅ D15, D20–D26 (hướng) · ❓ thiết kế chi tiết chờ duyệt (Q16) |`

## 5. §7.4 — R13 (cột Trạng thái)
Thay `| 1a (Member: 1b) | ✅ (D15) · ❓ cơ chế xác thực cụ thể (Q16) |` bằng `| 1a (Member: 1b) | ✅ (D15, D20–D26) · ❓ thiết kế chi tiết chờ duyệt (Q16) |`

## 6. §9.1 — A-0 (tiêu chí chấp nhận)
Thay `🔶 Người không có bằng chứng quyền không giành được quyền chủ chuyến (diễn giải của yêu cầu "an toàn")` bằng `✅ (D20) Người không có bằng chứng được hệ thống chấp nhận không giành được quyền chủ chuyến`

## 7. §15.1 — Q16 (cột 🔶)
Thay `Viết một **tài liệu thiết kế ngắn** (các tình huống mất thiết bị, mất mã, bị chiếm quyền) để bạn duyệt trước spec 1a.` bằng `Hướng đã chọn ở D20–D26. Đã có bản nháp **tài liệu thiết kế** (`docs/autopilot/q16-design-draft.md`: các tình huống mất thiết bị, mất mã, bị chiếm quyền); **còn chờ bạn duyệt** trước spec 1a.`

## 8. Không đổi
G7 (§14.3), §15.6, §9.2, §15.0, "Quy tắc đọc". Q16 giữ ❓, G7 giữ 🧪.

## 9. Sau khi áp dụng patch: cập nhật registry (tôi làm được ngay khi bạn báo đã áp dụng)
1. Chạy `node .claude/scripts/autopilot.mjs hash docs/wander-master-plan.md` để lấy sha256 mới.
2. `.claude/rules/wander-product-context.md` dòng 3: đổi `v0.3` → `v0.4` và hash cũ `091f166b487325423fa8f4bbd862080ccfe4969d0551526c3976ba82f62e04f0` → hash mới; mục "Status registry": `APPROVED: D1–D19` → `D1–D26`; `Q16` vẫn trong danh sách `OPEN`.
3. `CLAUDE.md`: "verified as **v0.3**" → "**v0.4**"; thêm dòng tóm tắt D20–D26 vào mục "Approved decisions"; dòng D15 "Mechanism **not chosen** (Q16)" → "direction chosen in D20–D26; detailed design pending approval (Q16)".
4. Lưu ý công cụ: `.claude/scripts/autopilot.mjs` dòng 65 hard-code `plan.version === 'v0.3'`, nên `preflight` sẽ báo `WARN plan_version` với v0.4 (không FAIL). `.claude/skills/wander-review/SKILL.md` dòng 18 cũng nhắc "v0.3". Cả hai thuộc công cụ, ngoài phạm vi lượt này; cập nhật khi bạn muốn.
