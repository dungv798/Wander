-- A-14 (Q14, DR-003): trạng thái đặt chỗ của mục. Hai giá trị: 'pending' (Chờ xác nhận, mặc định cho mục mới)
-- và 'booked' (Đã đặt). Nghỉ ('rest') và Việc cần làm ('task') không có đặt chỗ: để NULL.
ALTER TABLE items ADD COLUMN booking_status varchar(16);

UPDATE items SET booking_status = 'pending' WHERE type NOT IN ('rest', 'task');

ALTER TABLE items ADD CONSTRAINT items_booking_status_values
    CHECK (booking_status IS NULL OR booking_status IN ('pending', 'booked'));
ALTER TABLE items ADD CONSTRAINT items_booking_status_applicable
    CHECK ((type IN ('rest', 'task') AND booking_status IS NULL) OR (type NOT IN ('rest', 'task') AND booking_status IS NOT NULL));
