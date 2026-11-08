# Triển khai UI thật theo bản đã trao đổi

## Quyền và phân công

PO đã yêu cầu cập nhật UI app React thật, approve tác vụ thường; chỉ hỏi rủi ro thực sự/Tier A. Claude Code triển khai code; Codex chủ trì, tuyển/bổ sung ảnh và review. Haiku làm kiểm kê/tác vụ dễ; Sonnet làm chuyển UI vì cần giữ nhiều luồng. Không tự gọi thêm worker hoặc specialist; phối hợp tối đa 2 vòng phản biện, không mở vòng thứ ba. Codex sẽ gửi review có trigger/file cụ thể, Claude có quyền phản biện bằng bằng chứng.

Owned paths của Claude: `web/src/`, `web/e2e/`, `web/scripts/` (script chỉ phục vụ kiểm UI), `.logs/claude-handoff/` để báo cáo/ảnh. Không sửa backend/catalog, tools/, docs/design, docs/research, .claude/, .mcp.json, master plan hoặc dependency/package-lock. Các file web đang có thay đổi của PO đã được chụp vào `.logs/claude-handoff/before/web/`; phải giữ logic hiện có. Codex không sửa code app trong lúc Claude làm.

## Nguồn thiết kế

- Đọc `CLAUDE.md`, `docs/architecture/frontend-standards.md`, `.claude/rules/frontend.md`, các skill `ui-ux-pro-max`, `planning-and-task-breakdown`, `wander-feature`, `wander-verify`, TDD cho logic mới và systematic-debugging khi test lỗi. Gọi Skill nếu có, không chỉ nói đã dùng.
- Hướng hiện tại: `docs/design/liquid-review-2026-11-05/APPROVED-LOOK.md`, `HARMONY-RESULT.md`, `approved-b.css`, `visual-focus.js/css`, `mobile-hierarchy.js/css`, `harmony-review/`. Có thể đọc ảnh bằng Read. Prototype chạy ở 5190, app React là ứng dụng cần sửa, không thay nó bằng HTML prototype.
- Tinh thần: du lịch cho con người, ảnh và trải nghiệm thật, tương tác để chọn và lên chuyến; không viết app thành bài báo, không feed/review/trend giả. Map xuyên suốt, phong cảnh sáng trong xanh nước/mảng xanh dịu, cùng họ ghim/sticker. Bảng màu B: #243740 / #637b84, kính trắng ngả xanh, cam #f57932 nhấn nhỏ. Không trở về bộ cam/vàng lớn, đồng/bevel hoặc mỗi trang một màu.
- Giữ bố cục desktop đã được khen. Mobile thích ứng có chủ đích, không thu nhỏ desktop: filter theo độ dài chữ, 44px; ảnh dọc cạnh facts, ảnh ngang trước facts; detail cùng một template, toàn ảnh chính đúng tỷ lệ và có mở ảnh gốc; nền detail cùng chất liệu app. Nút lịch gắn với thẻ; điều khiển chế độ lịch khác cấp chọn ngày. Không panel chi tiết trùng bên phải, collage hoặc ảnh nổi trang trí trên map.

## Phạm vi phải hoàn tất

1. Shell responsive/app navigation: map bền xuyên Home/Dest/Picked/Trips/Trip với camera hợp ngữ cảnh; giữ lifecycle, không tạo nhiều map instance hoặc lộ vị trí người dùng khi chưa yêu cầu. Tận dụng MapLibre đã có, không thêm runtime dependency. Giữ tất cả route/deep link, auth và onboarding.
2. Home/Dest/Deck/Picked: chuyển bề mặt, layout và hành động theo bản mẫu; **giữ quẹt trái/phải, Chọn/Bỏ qua, Hoàn tác, tìm kiếm/lọc, cẩm nang, tập đã chọn, tạo/ghép vào chuyến**. Dùng catalog thật qua repository có sẵn, không nhúng STUDIO_DATA/fixture prototype.
3. Một PlaceSheet cho mọi điểm vào: giữ About, facts, highlights, buổi/mùa, tips, đường đi, nguồn ảnh/attribution và rating thật đã có; không thay bằng link ngoài khi feature thật đang tồn tại. Một palette/surface/button/icon system, tránh khoảng ảnh letterbox/crop bất hợp lý.
4. Trips/Trip: lịch theo ngày, chưa xếp, gợi ý/preview/apply/Undo, xếp tay/đổi ngày/chọn nhiều nếu đã có; edit/rest/task/order/cost empty≠0/included/booking/budget; soft delete/trash/restore; cover editor; today/checklist. **Giữ share, join, member/permissions, propose/approve/reject, export, recovery/device/settings, các trạng thái rỗng/tải/lỗi/offline** theo năng lực thật. Prototype chỉ là ý tưởng layout, không phải đặc tả cắt tính năng hay sao chép nhóm mock.
5. Motion/icon: dùng token chung trong `motion.const.ts`/motion.css và token CSS, không rải duration/easing/hex trong JSX. Press 100–160ms, chuyển surface 220–280ms, map fly 650–900ms khi hợp; reduced-motion tắt/giảm, hủy animation khi unmount, không reanimate checkbox/edit/cost. Native controls ≥44px; button icon line SVG cùng nét/kích thước, sticker 3D theo bộ sẵn có; không emoji font. Active/hover/focus/disabled nhất quán và thao tác mobile không phụ thuộc hover.

## Đạt và kiểm

- Lập checklist các feature hiện có và màn được đổi; không tự hạ trạng thái tính năng. Mọi thiếu sót của prototype phải nối bằng component thật, không gọi “100%” khi còn màn bỏ sót.
- Tập trung component tái sử dụng và stylesheet/token có chủ sở hữu, không chồng một file override khổng lồ với `!important` để che lỗi. Tách layout/view khỏi business/repository; tuân TSDoc/const/feature boundaries của repo.
- `npm --prefix web run typecheck`, lint, unit test, build; chạy test có ý nghĩa cho logic mới hoặc bị ảnh hưởng. Giữ test cũ, không xóa/skip hoặc nới assertion để xanh. Không chạy e2e/Gradle/dev.ps1 lúc Codex đang thay catalog; báo sẵn sàng để Codex điều phối một phiên kiểm cuối độc quyền.
- Tự xem ảnh thật 390×844, 360×800, 430×932, 375×667, 1440×1000, 768×1000; kiểm main routes + overlay/desktop/mobile/đổi breakpoint + reduced-motion. Chụp ảnh thật vào `.logs/claude-handoff/screens/`. Không báo đẹp/xong chỉ từ CSS hoặc checklist.
- Nếu có BLOCKER (API/backend chưa đáp ứng, auth máy, permission denied, cần dependency/schema mới), báo chính xác và tiếp tục việc độc lập; không tự cấp quyền hay giả dữ liệu, không hỏi PO lại những quyền thường đã được approve.

## Báo cáo cho Codex

Viết `.logs/claude-handoff/implementation.md`: file/feature thay đổi, kiểm thật đọc từ log, ảnh, rủi ro/bất đồng, kỹ năng và model thực dùng, phần chưa hoàn tất. Không commit/push/deploy. Trả về ngắn, nêu cần Codex review gì. Đây là lượt triển khai ban đầu; review của Codex và phản biện/fix tối đa 2 vòng sau đó.
