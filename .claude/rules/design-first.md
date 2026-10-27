# Design first — thiết kế xong và được duyệt trước khi làm backend mới (PO, 25/10/2026)

**DG-2 ĐÃ ĐÓNG (PO 26/10/2026, `docs/decisions/DR-019`); pha tới = dựng FE thật trước backend.** **Cổng DG-1 ĐÃ ĐÓNG (PO duyệt 25/10/2026, `docs/decisions/DR-010`; A1/A2/B1 ở `DR-011`).** Backend mới được làm theo `docs/ux/data-needs.md` §2, từng lát dọc qua `/wander-feature`. Lát nào chờ câu Tầng A còn mở (còn lại ở DR-018 §5; A3, B2–B4, E1, Q-d, Q6–Q9, Q12 đã được PO trả lời ở DR-018) thì dừng đúng chỗ đó và hỏi PO; **không** làm phần nhóm 1b hay quản trị cho tới khi PO quyết. Quy tắc dưới đây vẫn áp dụng cho mọi thay đổi giao diện/prototype về sau (mở lại cổng nếu thiết kế đổi lớn). Lịch sử: trước 25/10/2026 cổng mở và cấm backend mới.

## Kỹ năng BẮT BUỘC theo giai đoạn (gọi bằng công cụ Skill, ghi tên trong báo cáo)
| Giai đoạn thiết kế | Kỹ năng bắt buộc | Agent / công cụ kèm theo |
|---|---|---|
| 1. Hiểu yêu cầu, user flow, màn hình | `spec-driven-development` (có cổng "chờ PO duyệt") | `wander-product-analyst`; hỏi PO bằng `AskUserQuestion` khi là Tầng A |
| 2. Chia việc thiết kế thành lát có tiêu chí | `planning-and-task-breakdown` → `docs/implementation/plan.md`, `todo.md` | `TaskCreate`/danh sách việc |
| 3. Thiết kế từng màn và hệ thiết kế | `ui-ux-pro-max` (checklist truy cập, vùng chạm 44 px, responsive, tương phản, điều hướng; đọc `references/quick-reference.md`, tra CSV bằng Grep khi chưa có Python) | agent UX + UI (general-purpose, có brief), `wander-kit` |
| 4. Dựng prototype có thể bấm, **chụp ảnh thật** (playwright, 390×844, sáng và tối), thử thao tác thật | `/wander-verify` cho phần mã web nếu đụng `web/` | playwright-core + Chrome/Edge có sẵn |
| 5. Phản biện | `wander-skeptic-qa` và `wander-product-analyst` (≤ 2 vòng, ≤ 6 lượt) | báo cáo theo `review-output.md` |
| 6. Sửa → lặp lại 3–5 | `systematic-debugging` khi có lỗi chạy; `test-driven-development` khi viết logic | |
| Khi bắt đầu viết mã thật | `test-driven-development`, `/wander-feature` | |

Taste-Skill (`~/.claude/skills/design-taste-frontend`): **PO yêu cầu (25/10/2026) sửa theo kết quả của nó.** Với mỗi màn dựng xong, chạy `node ~/.claude/skills/design-taste-frontend/scripts/inspect.mjs <url> --app --widths 1280,768,390` (máy chủ prototype: `node docs/ux/tools/serve.mjs`), sửa MỌI `FAIL`, trừ những FAIL mà PO đã chọn giữ có chủ ý (ghi ở `docs/decisions/DR-009`; mỗi ngoại lệ phải có lý do trong `decisions.md`); mỗi `WARN` phải sửa hoặc ghi lý do bảo vệ (ví dụ ảnh thật làm tăng tỉ lệ màu). Sau đó chấm ảnh chụp theo `references/critique.md`. Khi Taste xung đột với look v4 đã duyệt thì HỎI PO bằng lựa chọn trước khi gỡ bất kỳ thứ gì làm nên look (bài học 25/10: tự gỡ gradient, bóng, huy hiệu tròn làm prototype khác hẳn mẫu). PO đã chọn hướng "lai" (DR-009).

## Quy tắc làm việc
- **Vòng lặp:** thiết kế → dựng → chụp ảnh/thử thật → phản biện → sửa → xác nhận. Không báo "xong" khi chưa xem ảnh chụp thật của chính màn đó.
- **Báo cáo cuối mỗi lượt có mục "Công cụ đã dùng"** (tên kỹ năng/agent, đã gọi thật hay không). Kỹ năng bắt buộc mà chưa gọi thì nói thẳng và gọi ngay.
- Không bịa dữ kiện hiển thị (giá, sao, giờ mở cửa). Nội dung biên tập là bản nháp có nhãn; chờ PO duyệt.
- Quyết định giao diện chạm sản phẩm (ví dụ ai được xóa, "chưa chắc ngày") là Tầng A: hỏi PO bằng lựa chọn, rồi làm tiếp ngay.

## DG-1 đóng khi đủ cả 8 mục (và PO duyệt)
1. **User flow** của mọi luồng chính được duyệt (`docs/ux/user-flows.md`): người mới, khám phá, lưu thành chuyến đi, lập lịch theo ngày, chi phí và đặt chỗ, xóa/Hoàn tác/đã xóa gần đây, khôi phục và thiết bị thứ hai, mời nhóm và duyệt đề nghị xóa, quản trị nội dung.
2. **Kiểm kê màn hình** đầy đủ (`docs/ux/screens.md`): mỗi màn có mục đích, dữ liệu, hành động, trạng thái rỗng, lỗi, đang tải, ngoại tuyến.
3. **Hệ thiết kế** (`docs/ux/design-system.md`): token màu sáng/tối, kiểu chữ, khoảng cách, thành phần, biểu tượng, chuyển động, giọng văn, thuật ngữ.
4. **Prototype bấm được** phủ 100% luồng ở mục 1, có ảnh chụp 390 px sáng và tối cho từng màn (`docs/ux/screenshots/` hoặc liên kết artifact).
5. **Danh sách kiểm truy cập** đạt: tương phản chữ ≥ 4,5:1, vùng chạm ≥ 44 px, thao tác chỉ-cử-chỉ đều có nút tương đương, focus nhìn thấy, tôn trọng giảm chuyển động.
6. **Ánh xạ thiết kế → dữ liệu/API** (`docs/ux/data-needs.md`): mỗi màn cần trường nào, cái nào chưa có ở backend; danh sách thay đổi backend (migration, API) sẽ làm sau DG-1.
7. **Phản biện độc lập** (skeptic-qa + product-analyst) không còn BLOCKER/MAJOR.
8. **PO duyệt bằng văn bản** (DR mới), liệt kê Tầng A còn mở.
