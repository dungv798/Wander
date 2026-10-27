-- DR-018 E1: số khớp cho ghép thiết bị và xác thực lại. Số thật + chuỗi lựa chọn (đã xáo, cố định lúc tạo) lưu cùng yêu cầu.
-- Mặc định chỉ để điền dòng cũ khi thêm cột, rồi bỏ: insert nào quên cột sẽ lỗi thay vì nhận thử thách đoán được.
-- Thêm trạng thái 'denied': chọn sai số hoặc từ chối chủ động là từ chối vĩnh viễn yêu cầu đó.
ALTER TABLE device_links ADD COLUMN match_number integer NOT NULL DEFAULT 10 CHECK (match_number BETWEEN 10 AND 99);
ALTER TABLE device_links ADD COLUMN match_options varchar(11) NOT NULL DEFAULT '10,11,12';
ALTER TABLE device_links ALTER COLUMN match_number DROP DEFAULT;
ALTER TABLE device_links ALTER COLUMN match_options DROP DEFAULT;
ALTER TABLE device_links DROP CONSTRAINT device_links_state_check;
ALTER TABLE device_links ADD CONSTRAINT device_links_state_check CHECK (state IN ('pending', 'approved', 'expired', 'denied'));

ALTER TABLE step_up_requests ADD COLUMN match_number integer NOT NULL DEFAULT 10 CHECK (match_number BETWEEN 10 AND 99);
ALTER TABLE step_up_requests ADD COLUMN match_options varchar(11) NOT NULL DEFAULT '10,11,12';
ALTER TABLE step_up_requests ALTER COLUMN match_number DROP DEFAULT;
ALTER TABLE step_up_requests ALTER COLUMN match_options DROP DEFAULT;
ALTER TABLE step_up_requests DROP CONSTRAINT step_up_requests_state_check;
ALTER TABLE step_up_requests ADD CONSTRAINT step_up_requests_state_check CHECK (state IN ('pending', 'approved', 'consumed', 'denied'));
