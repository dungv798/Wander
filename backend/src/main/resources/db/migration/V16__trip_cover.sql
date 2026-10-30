-- DR-031: bìa lưu máy chủ; NULL = ảnh bìa tự động của điểm đến.
-- Chỉ lưu mã (photo:<slug> hoặc gradient:cover-1..6), không lưu URL hay ảnh tải lên.
ALTER TABLE trips ADD COLUMN cover varchar(130);
