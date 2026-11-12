# Mô hình đe dọa Lát 1a — bản nháp 1 trang (12/11/2026)

**Trạng thái:** `APPROVED` (PO duyệt 12/11/2026, DR-039). Phạm vi phát hành: **chỉ người quen**; "người lạ" vẫn bị chặn bởi RG-2/5/6 (CLAUDE.md).
**Nguồn và độ tin cậy:** báo cáo rà an ninh 12/11/2026 của `wander-security-reviewer` (đọc mã, tài liệu và tên test; chưa đọc thân test), `docs/autopilot/q16-design-draft.md`, DR-001/018/035. Mục nào chưa có bằng chứng ghi `UNVERIFIED`. Không phải tuyên bố "an toàn": G7 vẫn `UNVERIFIED`.

## 1. Tài sản
(1) Quyền sở hữu chuyến đi của một danh tính ẩn danh (mất = mất chuyến vĩnh viễn, D20). (2) Bí mật phiên (Bearer, `localStorage` khóa `wander.web.token.v1`). (3) Mã khôi phục 30 ký hiệu × 5 bit = 150 bit (chỉ lưu băm có pepper). (4) Dữ liệu chuyến: tên chuyến, mục, chi phí; bản đọc-chỉ ở `localStorage` (B-09). (5) Tính sẵn sàng của dịch vụ miễn phí (Render Free + Neon).

## 2. Kẻ tấn công và ranh giới tin cậy
- **Người ngoài chưa có phiên:** chỉ gọi được API công khai (tạo danh tính, khôi phục, ghép máy, danh mục); `/api` đóng theo mặc định (`SecurityIT`, theo báo cáo).
- **Kẻ cầm máy đang mở phiên** (nhặt điện thoại, người chung máy): có phiên hợp lệ tới 14 ngày không dùng.
- **Kẻ chạy được script trong trang (XSS):** đọc được token và bản lưu chuyến.
- **Người quen có ác ý:** biết tên chuyến/điểm đến nhưng không được dùng làm bằng chứng (INV-5).
- Ranh giới: trình duyệt ↔ máy chủ qua HTTPS (Render); máy chủ ↔ Neon. Phía CDN/WAF: không có.

## 3. Mối đe dọa chính
| # | Mối đe dọa | Hiện trạng | Mức cho "người quen" |
|---|---|---|---|
| T1 (B2) | Kẻ cầm máy mở phiên phát mã đầu tiên khi danh tính CHƯA có mã (`beginReplacement` chỉ cần phiên), rồi thu hồi các máy khác: chủ mất quyền vĩnh viễn | PO đã chấp nhận (DR-018 B2); chưa có test chứng minh giới hạn | Chấp nhận có điều kiện (DR-039) |
| T2 (F1) | Phiên bị chiếm tự ghép máy thứ hai rồi tự duyệt step-up để đổi mã; hạn mức theo danh tính chỉ làm chậm | PO đã chấp nhận (DR-018 F1, DR-035 Q-b) | Chấp nhận có điều kiện |
| T3 | XSS lấy token `localStorage` | Không có `innerHTML/eval`; một `dangerouslySetInnerHTML` (`Icon.tsx`) nguồn hằng tĩnh; CSP `script-src 'self'`, không `unsafe-inline`; `connect-src` còn cho `s3.amazonaws.com` (kênh thoát nếu có XSS, `INFERENCE`); chưa duyệt từng thành phần (`UNVERIFIED`) | Thấp–vừa |
| T4 | Giả `X-Forwarded-For` để né/đốt giới hạn tốc độ | Hop = 0 (bỏ qua XFF) nên không giả được; hệ quả: mọi người chung một thùng (một người bấm nhiều là cả hệ thống nhận 429) | Chấp nhận; số N đúng `UNVERIFIED`, hoãn tới khi chốt nơi chạy |
| T5 | Dò mã khôi phục | 150 bit, giới hạn tốc độ; rủi ro chủ yếu là tính sẵn sàng, không phải đoán mã | Thấp |
| T6 | Mất mã / bỏ qua mã rồi hết phiên | SES-1: chưa có mã thì chỉ hạn trượt; có mã thì trần 90 ngày. UI cảnh báo trước hạn: `UNVERIFIED` | Vừa (mất dữ liệu, không phải lộ) |
| T7 | Rò dữ liệu qua bản lưu `localStorage` hoặc tệp mã `.txt` tải về | Người dùng chọn; cần câu cảnh báo (`UNVERIFIED` đã có hay chưa) | Thấp |
| T8 | Lệch thời gian phản hồi lộ mã đúng/sai | Thân lỗi đồng nhất có test (INV-6); thời gian của `hasher.matches`: `UNVERIFIED` | Chưa biết |
| T9 | Ping keep-warm bị Render coi là lách gói | Rủi ro điều khoản, mức độ không biết (DR-037) | Vận hành |

## 4. Tiêu chí "đủ an toàn cho người quen" (đo được, `PROPOSED`)
(a) Mọi INV/NEG còn hiệu lực ở 1a có test tên rõ, kết quả đọc từ `build/test-results`. (b) Bảng truy vết INV/NEG → tên test trong repo. (c) Mô hình này được PO duyệt, B2 và F1 ghi trong DR. (d) Thử với ≥ 3 người quen: bao nhiêu người giữ được mã và khôi phục được trên máy mới. (e) Đã làm một lần sao lưu pepper + `pg_restore`.

## 5. Test còn thiếu (theo báo cáo, đọc tên test)
NEG-2/INV-2 nửa sau (kiểm quyền lại ngay trước khi ghi sau khi bị thu hồi giữa chừng), NEG-1/INV-5 (không dùng tên chuyến/điểm đến làm bằng chứng), NEG-14 (phiên cũ thấy phiên mới), NEG-15 (xóa mềm không cần step-up), NEG-20 (xóa cả chuyến sau khôi phục). Không áp dụng ở 1a: INV-3/4, NEG-3/4 (1b), INV-8/9, NEG-7/8/9 (Q17b chưa có xóa cả chuyến).

## 6. Việc hoàn thiện đề xuất (ước giờ, không có số đo)
Làm được ngay, không cần PO thao tác: bảng truy vết INV/NEG (~2 giờ) · năm test còn thiếu (~4) · dùng `safeHttpUrl` cho 4 `href` ngoài + luật `react/no-danger` (~1) · CSP: `object-src 'none'` + test ghim chuỗi CSP (~1,5) · kiểm thời gian `hasher.matches` (~1) · sửa tài liệu lệch (Javadoc "RG-1", runbook ping) (~0,5). Cần PO: đo hop (sau khi chốt nơi chạy, ~1,5), sao lưu pepper + `pg_restore` (~1,5), thử ≥ 3 người quen (~2), thu hẹp `connect-src` S3 qua proxy cùng nguồn (Q-c, cần hạ tầng).
