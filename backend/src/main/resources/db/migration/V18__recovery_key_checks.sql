-- Dấu vân tay (một phần HMAC của hằng số công khai) cho từng nhãn khóa khôi phục. Khởi động so với khóa đang cấu hình để bắt lỗi
-- đổi giá trị pepper mà giữ nguyên nhãn, nếu không mọi mã cũ sẽ chết im lặng. Không chứa khóa, không dùng để dò khóa.
CREATE TABLE recovery_key_checks (
    key_version varchar(32) PRIMARY KEY,
    fingerprint varchar(64) NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
);
