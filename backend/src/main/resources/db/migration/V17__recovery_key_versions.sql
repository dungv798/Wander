-- Không đổi digest và không vô hiệu mã: dữ liệu HMAC trước đây được gắn nhãn v1.
-- Metadata đi cùng cả mã đang hiệu lực và mã đang chờ để deploy giữa hai pha vẫn xác minh được.
ALTER TABLE recovery_codes ADD COLUMN key_version varchar(32) NOT NULL DEFAULT 'v1';
ALTER TABLE recovery_attempts ADD COLUMN key_version varchar(32) NOT NULL DEFAULT 'v1';
ALTER TABLE code_replacements ADD COLUMN key_version varchar(32) NOT NULL DEFAULT 'v1';
