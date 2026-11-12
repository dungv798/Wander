# Việc trên Render cần PO thao tác (12/11/2026)

Ba việc dưới đây tôi (Claude) không làm thay được: cần bảng điều khiển Render/Neon của bạn, hai mạng khác nhau, hoặc người thật. Làm theo thứ tự. Mọi bí mật (pepper, mật khẩu DB) chỉ để trong trình quản lý mật khẩu của bạn, **không dán vào chat hay repo**. Nguồn quy trình: `docs/implementation/free-deployment-runbook.md` §4 bước 4 và §6; kết quả rà an ninh ở `docs/security/threat-model-1a.md`.

## 1. Đo số hop proxy trên Render (RG-5) — khoảng 1,5 giờ
Mục đích: biết Render nối `X-Forwarded-For` thế nào để đặt `WANDER_TRUSTED_PROXY_HOPS` **bằng đúng số proxy thật**. Mặc định 0 là an toàn nhưng cả hệ thống chung một thùng giới hạn (30 lượt tạo danh tính/giờ).
Cách đo không cần endpoint gỡ lỗi: dùng chính giới hạn tốc độ làm "cảm biến".
1. Ở Render, dịch vụ Wander, đặt tạm `WANDER_LIMIT_IDENTITY=2` và `WANDER_TRUSTED_PROXY_HOPS=0`. Lưu (Render tự khởi động lại; lần thức dậy có thể 1–3 phút; bộ đếm trong bộ nhớ nên reset khi khởi động lại).
2. Từ **mạng A** (wifi nhà), chạy 3 lần: `curl -s -o NUL -w "%{http_code}\n" -X POST https://wander-fx65.onrender.com/api/identity`. Mong đợi: 201, 201, 429. (Mỗi lần thành công tạo một danh tính thử trong DB, chấp nhận được.)
3. Đổi `WANDER_TRUSTED_PROXY_HOPS=1`, lưu (khởi động lại, bộ đếm về 0). Từ mạng A chạy 3 lần, mỗi lần thêm header giả khác nhau: `-H "X-Forwarded-For: 1.1.1.1"`, rồi `2.2.2.2`, rồi `3.3.3.3`. Mong đợi: **201, 201, 429**. Nếu cả ba đều 201 thì header giả đổi được thùng, tức hop=1 là sai: về 0 và dừng.
4. Từ **mạng B** (4G, tắt wifi), chạy 1 lần không header giả. Mong đợi **201** (thùng riêng so với mạng A). Nếu 429 thì hop=1 chưa đúng hoặc cả hai mạng bị thấy cùng một địa chỉ: về 0.
5. Lặp bước 2–4 một lần nữa trên mạng có IPv6 nếu có. Nếu kết quả dao động giữa các lần thì giữ 0.
6. Xong: xóa `WANDER_LIMIT_IDENTITY` (về mặc định), giữ số hop đã kiểm đúng, rồi báo tôi số liệu để ghi DR thay Q-d của DR-035.

## 2. Sao lưu pepper và thử khôi phục DB (RG-2 tiêu chí e) — khoảng 1,5 giờ
1. Chắc chắn `WANDER_RECOVERY_PEPPER` của dịch vụ Render đã có bản sao trong trình quản lý mật khẩu của bạn (mất pepper = mọi mã khôi phục vô hiệu).
2. Sao lưu Neon: `pg_dump -Fc` bằng client PostgreSQL 17, lấy chuỗi kết nối từ dashboard Neon, **không** để mật khẩu trong lịch sử lệnh (dùng biến môi trường `PGPASSWORD` trong phiên đó hoặc file `.pgpass`). Lưu file dump ngoài repo.
3. Tạo một DB trống khác (nhánh Neon thử hoặc Postgres local), `pg_restore` vào đó, rồi đếm bảng `identities`, `trips` so với nguồn. Chỉ tin bản sao lưu sau khi bước này khớp.
4. Báo tôi: khớp hay không, mất bao lâu. Tôi ghi vào runbook §6 (RPO/RTO vẫn do bạn chốt).

## 3. Thử với ít nhất 3 người quen (RG-2 tiêu chí d) — khoảng 2 giờ
Tiêu chí: **bao nhiêu người giữ được mã khôi phục và khôi phục được trên máy mới**. Mỗi người, không hướng dẫn thêm ngoài màn hình:
1. Mở app, tạo một chuyến, chọn "Lưu mã" khi được hỏi (hoặc bỏ qua, ghi lại họ chọn gì).
2. Hẹn 1 ngày sau: mở bằng máy khác, dùng mã để vào lại chuyến.
3. Ghi bảng: người | giữ mã ở đâu | khôi phục được không | họ vướng ở bước nào (câu nguyên văn). Gửi tôi bảng; tôi tổng hợp vào threat-model §4(d) và sửa chữ/luồng nếu có chỗ vướng chung.
Lưu ý: chỉ mời người quen (DR-039); dữ liệu của họ nằm trên Render/Neon miễn phí, không có cam kết uptime.
