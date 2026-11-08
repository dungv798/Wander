# UI B và kho ảnh — Codex nhận lại 06/11/2026

> **Đính chính sau phản hồi PO:** báo cáo này ghi lần triển khai/kiểm thử trước, chưa chứng minh app bám đúng UI và flow B. Navbar, Home sau chọn điểm đến, sân khấu quẹt, Chi tiết, đường tạo chuyến và vật liệu nút còn sai khác. Xem [đối chiếu mới](b-parity-flow-audit-2026-11-06.md), bao gồm cả những flow của prototype chưa có trong app.

PO yêu cầu từ đây Codex trực tiếp xử lý, không dùng thêm Claude. Worker `ui-review1-resume` dừng 09:43 giờ Việt Nam vì giới hạn 5 giờ, không có báo cáo kết thúc; mã đã lưu được giữ và rà lại. Không gọi vòng Claude mới, không commit/push/deploy, không đổi cơ chế quyền hoặc master plan.

## Những phần đã triển khai trước lượt đối chiếu B

- Trang chủ và điểm đến: ảnh thật, CTA quẹt rõ, bộ lọc theo loại, danh sách nơi có hành động chọn; bản đồ khung chung đổi cảnh theo màn. Chọn thẻ điểm đến ở Home mở màn điểm đến; quẹt vẫn có nút riêng. Trạng thái đã chọn dùng chung giữa thẻ, danh sách và bản đồ.
- Chi tiết: một template cho mọi địa điểm; ảnh giữ tỷ lệ, ảnh dọc bên cạnh thông số, ảnh ngang phía trên. Buổi/mùa/mẹo gập mở, đường đi, đánh giá Wander, chọn/hoàn tác và hành động chuyến đi được giữ. Thêm lối tìm Google Maps theo tên + khu vực để đối chiếu thông tin hiện tại. Không có preview review Google nhúng hoặc điểm sao Google giả.
- Chuyến đi: tách chế độ Tổng quan/Lịch/Chưa xếp/Chi phí khỏi thanh chọn ngày; ngày có URL riêng, nhớ ngày vừa xem; gán ngày tại thẻ chưa xếp. Giữ gợi ý/xem trước/đổi ngày/áp dụng/hoàn tác, thêm mục/nghỉ/việc cần làm, giờ/chi phí/đặt chỗ, thùng rác/khôi phục, chia sẻ/mời/thành viên và màn Hôm nay/xuất lịch.
- Nút và biểu tượng: dùng hệ điều khiển chung, mực xám xanh + kính mát + cam nhấn B; làm nhẹ viền, cùng phản hồi chạm/hover, nhóm chuyển ảnh có nút đủ vùng chạm. Giảm chuyển động được tôn trọng. Không đổi stack hoặc thêm runtime dependency.
- Bản đồ: giảm rối nhãn ở mức zoom thấp, giữ tiếng Việt và số hiệu đường, sửa tên bị lặp từ format song ngữ; cụm nhẹ viền hơn. Bộ chụp ảnh chờ renderer có ghim/cụm trước khi chụp.
- Trekking: tìm theo trekking/hiking/leo núi; giữ icon/category leo. Chi tiết không hiện ước tính xe máy lên đỉnh như tuyến leo. Cung chưa rõ thời lượng hoặc kéo dài nhiều ngày được giữ ở Chưa xếp, cần người dùng chốt tuyến rồi tự bố trí. Sửa tổng hợp xem trước để tính lại sau mỗi lần đổi ngày.
- Ghi công: API bổ sung `coverPhoto` có tác giả/giấy phép/nguồn, tương thích trường `coverUrl` cũ. Hero có nút nguồn ảnh; trang điểm đến có bảng nguồn ảnh gập; khoảnh khắc mở ảnh kèm nguồn và CTA quẹt.

## Dữ liệu thật

20 điểm đến, 162 điểm Discover, 1.434 POI bổ trợ, 310 ảnh POI và 107 khoảnh khắc. So với snapshot trước đợt 05–06/11: thêm 8 điểm đến, 26 điểm Discover, 40 ảnh POI và 57 khoảnh khắc. Không đồng nhất số ảnh, khoảnh khắc và POI; không gọi là đã phủ hết Việt Nam.

Tám vùng mới: Sa Pa, Cao Bằng, Ninh Bình, Hạ Long, Phong Nha, Buôn Ma Thuột, Phú Quốc, Cần Thơ. Bổ sung hoạt động/chợ/món ăn/nghề địa phương qua ảnh đã kiểm nguồn và xem trực tiếp. Các ảnh tự ghép sai Tam Cốc/Tràng An, Phong Nha/Thiên Đường, Bãi Sao/VQG đã bỏ khỏi các mục mới; giữ tệp để đối chiếu. Bộ dựng catalog có chế độ chỉ bổ sung, bảo toàn khoảnh khắc/bìa đã tuyển.

[Báo cáo dữ liệu và ảnh](../research/photo-curation-2026-11-06.md) · [Manifest Pexels](../research/photo-candidates/pexels-editorial-2026-11-06.json) · [Audit bảo toàn](../research/photo-candidates/curated-2026-11-06/audit.json).

## Kiểm chứng

- Backend: 359/359 PASS, 0 skipped; đọc `.logs/backend-test.log` và JUnit XML. Hai lần trước: lỗi kiểu trong assertion mới và assertion cũ cho rằng Sa Pa chưa có; đã sửa mà vẫn kiểm cả tìm không khớp.
- Frontend: lint và TypeScript PASS, **401 unit test PASS**, build production PASS. Sau khi chụp thật phát hiện Liberty dùng thêm `case/concat`, đã đối chiếu JSON nền thật và bổ sung regression test để xử lý cả `format` lẫn `case/concat`. Bảy ca trọng điểm PASS lại sau sửa nhãn. MapLibre tách thành gói tải lười; cảnh báo kích thước gói MapLibre vẫn tồn tại.
- **20 ảnh của 10 màn** tại 390×844 và 1440×1000 trong `.logs/claude-handoff/screens/codex-final`: 0 lỗi trang/tràn ngang do harness ghi nhận, backend thật. Đã xem trực tiếp Home desktop, chi tiết dọc mobile và lịch ngày mobile. Bộ `codex-polish` trước đó cũng có 10 ảnh, 0 vấn đề.
- **4 ảnh bổ sung** của chi tiết/lịch ngày tại 360×800 và 375×667 trong `.logs/claude-handoff/screens/codex-small`: 0 vấn đề; đã xem trực tiếp chi tiết 375×667 và lịch ngày 360×800. Tổng bộ cuối: 24 ảnh responsive. Kiểm bằng Chrome/Playwright, không gọi là đã thử trên iPhone vật lý.
- E2E với Java thật: **101/101 PASS, 0 skipped**, `.logs/e2e.log`, `RESULT: PASS (525s)`. Các lần trước tìm ra nút thành viên bị lặp, nút thử lại nền bị tờ che và các assertion cũ. Ca bản đồ đã sửa để chờ camera dừng, chọn cụm không bị ghim che, kiểm ID dữ liệu thay vì số ghim đang nhìn thấy; không force-click hoặc bỏ test. Bảy ca trọng điểm cũng PASS riêng trước lượt cuối.
- Kho ảnh: bảy bảng `curated-2026-11-06`, tất cả `broken: []`; audit bảo toàn PASS. Có 12 mục thuộc nhóm đi bộ/leo núi/trekking, trong đó Hang Múa/Hàm Rồng là đi bộ tham quan, không quảng bá tất cả thành cung trekking rừng.

Kỹ năng thực sự dùng: `.claude/skills/ui-ux-pro-max/SKILL.md` (Python tìm kiếm không có runtime khả dụng, dùng checklist tham chiếu), `.claude/skills/wander-verify/SKILL.md`, đối chiếu quy trình `.claude/skills/systematic-debugging/SKILL.md` khi rà bằng chứng lỗi bản đồ. Công cụ: CLI/PowerShell, Playwright/Chrome, web research nguồn chính thức, audit catalog. MCP graph không có trong tập công cụ phiên này.

Không có quyết định Tầng A mới đang chờ PO trong phạm vi này. Những nơi thiếu ảnh đúng POI và các tuyến chưa đủ dữ liệu được ghi rõ trong báo cáo dữ liệu; không tự tạo giờ/giá/rating/GPX hoặc xác nhận tuyến đang mở.

## Mở xem

- App thật, bản xem thử cục bộ dùng DB thử riêng: `http://127.0.0.1:8787/`. Chưa deploy; thời hạn helper đã được gia hạn trong lượt rà B sau đó, giữ nguyên DB.
- [Home desktop](../../.logs/claude-handoff/screens/codex-final/home--1440x1000.png) · [Home mobile](../../.logs/claude-handoff/screens/codex-final/home--390x844.png) · [Chi tiết](../../.logs/claude-handoff/screens/codex-final/place-portrait--390x844.png) · [Lịch ngày](../../.logs/claude-handoff/screens/codex-final/trip-day1--390x844.png) · [Chưa xếp](../../.logs/claude-handoff/screens/codex-final/trip-unassigned--390x844.png) · [Gợi ý](../../.logs/claude-handoff/screens/codex-final/trip-suggestion--390x844.png).
- API đã kiểm thật sau khi khởi động bản xem thử: 20 điểm đến, tổng 162 điểm, 20/20 ảnh bìa có ghi công.
- Kiểm lại 12:55 ngày 06/11 theo giờ Việt Nam: HTTP health `UP`, API vẫn trả 20 điểm đến/162 điểm/20 bìa có ghi công. Bản xem thử hiện tại được mở khoảng 10:50, dự kiến helper dừng khoảng 13:50; việc dừng server không xoá DB. Không reset DB để gia hạn bản xem thử.
- Phần giữ nguyên trạng thái chưa có từ trước: xuất PDF/Lịch. Xuất PNG đã kiểm thật và hoạt động; các nút tương lai không được giả là đã làm.
