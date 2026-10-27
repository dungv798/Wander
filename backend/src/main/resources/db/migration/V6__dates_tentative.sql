-- Lát 6 (DR-018 A3 "Dự kiến N ngày"): chuyến chưa chốt ngày. Ngày đi/về vẫn bắt buộc (thứ trong tuần tính từ ngày đi);
-- cờ này chỉ để giao diện gắn nhãn "chưa chắc". Chuyến cũ là đã chốt (false).
ALTER TABLE trips ADD COLUMN dates_tentative boolean NOT NULL DEFAULT false;
