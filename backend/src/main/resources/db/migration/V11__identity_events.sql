-- BE-11: nhật ký sự kiện bảo mật cho "Hoạt động gần đây" ở màn Bảo mật. Khóa chính là số tự tăng để thứ tự ổn định khi nhiều sự kiện
-- cùng một thời điểm (tạo danh tính + mã). Mỗi danh tính giữ tối đa 50 sự kiện mới nhất (cắt khi ghi, ở tầng ứng dụng).
-- device_name là nhãn do thiết bị tự khai (chưa xác minh). events_seen_id: mã sự kiện lớn nhất chủ đã thấy khi mở màn Bảo mật; "chưa xem" =
-- có sự kiện thêm thiết bị (paired, recovered) có mã lớn hơn mốc này. So theo mã (không theo thời gian) để không lệch đồng hồ giữa hai giao dịch.
CREATE TABLE identity_events (
    id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    identity_id   uuid NOT NULL REFERENCES identities(id),
    kind          varchar(16) NOT NULL CHECK (kind IN ('created', 'code', 'paired', 'revoked', 'recovered')),
    device_name   varchar(60),
    occurred_at   timestamptz NOT NULL
);
CREATE INDEX identity_events_by_identity ON identity_events(identity_id, id DESC);
ALTER TABLE identities ADD COLUMN events_seen_id bigint;
