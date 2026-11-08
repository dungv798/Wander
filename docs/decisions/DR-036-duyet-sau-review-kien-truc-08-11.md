# DR-036 — Duyệt sau review kiến trúc toàn ứng dụng (08/11/2026)

**Trạng thái:** APPROVED (PO chọn trực tiếp trong phiên 08/11/2026 bằng `AskUserQuestion`; mỗi lựa chọn là phương án được khuyến nghị).
**Nguồn:** báo cáo `/wander-review` kiến trúc BE + FE (08/11/2026: `wander-software-architect`, `wander-code-reviewer`, `wander-skeptic-qa`), `.logs/prep-*.log`.

## Quyết định
| Mã | Câu hỏi | Lựa chọn của PO | Hệ quả |
|---|---|---|---|
| REL-1 | Cho người quen dùng bản Render + Neon khi RG-2/5/6/7 còn mở? | **Thử nghiệm kín** | Chỉ vài người quen, PO ghi rõ chấp nhận rủi ro (B2/F1, localStorage). Chỉ mở SAU khi xong: đo proxy hop và đặt `WANDER_TRUSTED_PROXY_HOPS`; đo lại heap/startup với code hiện tại; thử Neon cold start (20 yêu cầu song song); thử điện thoại thật; sao lưu pepper và restore một lần; chốt commit sạch. RG-2/5/6/7 KHÔNG được coi là đóng. Không mở cho người lạ. |
| POI-1 | Kho POI (~36,5 MiB JSON nạp vào heap)? | **A: giữ trong RAM, giảm kích thước** | Không chuyển POI vào PostgreSQL; ADR-010 §2 giữ nguyên. Đo 08/11 (probe tạm, đã xóa): kho POI + catalog chiếm ~49,6 MiB heap sau GC (~20% của `-Xmx256m`). Đã gom chuỗi trùng của `FieldProvenance`. Phương án B chỉ bàn lại nếu số đo sau này cho thấy A không đủ. |
| UI-1 | Nguồn bộ màu duy nhất | **`web/src/styles/tokens.css` là nguồn; giữ `classic.css`** | Cập nhật `CLAUDE.md` và `.claude/rules/frontend.md` theo bản `web/`; `docs/ux/prototype/tokens.css` là bản lịch sử của prototype. Giao diện người dùng không đổi. |
| Q15 / ADR-011 | Cache đọc khi mất mạng và Spring Modulith | **Q15 sau lần thử kín; ADR-011 hoãn** | Q15 (service worker/Cache API) lên lịch sau phản hồi từ nhóm thử. Không thêm Spring Modulith/outbox; ADR-011 cần cập nhật cho khớp 4 module (`identity`, `planning`, `catalog`, `rating`). |

## Mặc định Tầng B đã làm cùng đợt (đảo ngược được)
- BE: ghi `last_seen_at` thưa (tối thiểu 5 phút một lần; hạn trượt 14 ngày không đổi); `DataIntegrityViolationException` → 409 `CONCURRENT_MODIFICATION` thay vì 500; profile `free`: `connection-timeout` 30 s → 15 s và `jakarta.persistence.query.timeout` 15 s; `FieldProvenance` dùng lại hằng số/intern chuỗi; comment làm rõ `backend/Dockerfile` không dành cho Render.
- FE (giao Codex): poll ghép thiết bị chống gọi chồng, backoff, tạm dừng khi tab ẩn; lazy-load `TripScreen`/`TodayScreen`/`DeckScreen`; thay `localStorage` trực tiếp bằng `PersistentStore` ở chỗ làm được; ảnh danh sách `loading="lazy"` + kích thước.

## Còn mở (không quyết định thay PO)
- RG-2, RG-4 (Replay test), RG-5, RG-6, RG-7; AD-17, AD-19; "chưa chắc ngày" so với R5.
- Chưa có bài đo tải; đo heap thật khi có người dùng; lỗ hổng ArchUnit (xem báo cáo review) chưa thêm luật.

## Bổ sung cùng ngày (PO trả lời sau khi commit)
| Mã | Câu hỏi | Lựa chọn của PO | Hệ quả |
|---|---|---|---|
| DATA-1 | Commit dữ liệu catalog (~170 MiB: JSON, POI, 308 ảnh) | **Commit nguyên khối** | Đã commit `3502a01`; `.git` ~344 MiB; lịch sử không viết lại. |
| DATA-2 | `docs/research` (~142 MiB) | **Chỉ commit phần nhỏ, ignore dữ liệu nặng** | Commit `480978d`; `.gitignore` các thư mục photo-fill, expansion, completion, photo-multisource và ảnh trong photo-candidates (vẫn còn trên đĩa). |
| DATA-3 | `docs/design/liquid-review-2026-11-05` (418 MiB) và `web/spike` | **Ignore cả hai** | Đã vào `.gitignore`, không commit. |
| PUSH-1 | Push `origin/main` | **Push ngay** | Push 6 commit (backend, web, tools, docs, data, research); không đẩy `.mcp.json`, `docs/UI-sample-2`, `tools/codex-mcp`, `tools/codex-skills`, `tools/claude-handoff`. |
| DATE-1 | Công tắc "chưa chắc ngày" so với R5 | **Hoãn, giữ R5 hiện tại** | Chuyến vẫn luôn có ngày; quay lại sau phản hồi của nhóm thử. |
| AD-17/19 | Công cụ trace; khung tích hợp ngoài, hàng đợi việc | **Giữ OPEN** | Chưa có nhu cầu thật; xét khi dựng quan sát AWS (T-14) hoặc N-1/N-3/N-4. |
| NEXT-1 | Việc tiếp theo | **Chuẩn bị demo Render + Neon** | Theo `docs/release/huong-dan-release.html`; PO tự nhập secret, Claude không chạm credential. |
