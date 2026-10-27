-- BE-10 (PO, 27/10/2026): sở thích "Bạn mê gì?" lưu theo danh tính, không theo chuyến, để theo người dùng sang máy khác.
-- Khóa chính là mã danh tính; KHÔNG có khóa ngoại sang identities (planning và identity giữ dữ liệu riêng, ADR-003).
-- interests: mã cách nhau bằng dấu phẩy theo thứ tự khai báo ('' = không có), tối đa 6, kiểm ở domain (cùng quy tắc trips.interests).
CREATE TABLE owner_preferences (
    owner_identity_id  uuid PRIMARY KEY,
    interests          varchar(100) NOT NULL DEFAULT '',
    updated_at         timestamptz NOT NULL
);
