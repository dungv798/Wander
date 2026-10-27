-- Lát 5: tên thiết bị do thiết bị tự khai (nhãn để người dùng nhận ra máy ở màn Bảo mật; không dùng để xác thực).
-- Nullable: phiên cũ và máy không khai tên là "chưa đặt tên". Giới hạn 1..60 ký tự (khớp IdentityConstants.MAX_DEVICE_NAME_LENGTH).
ALTER TABLE sessions ADD COLUMN device_name varchar(60) CHECK (device_name IS NULL OR char_length(device_name) BETWEEN 1 AND 60);
ALTER TABLE device_links ADD COLUMN device_name varchar(60) CHECK (device_name IS NULL OR char_length(device_name) BETWEEN 1 AND 60);
ALTER TABLE recovery_attempts ADD COLUMN device_name varchar(60) CHECK (device_name IS NULL OR char_length(device_name) BETWEEN 1 AND 60);
