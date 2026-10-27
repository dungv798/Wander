-- DR-011 A1 (b) và DR-006: mục có thể chưa có ngày ("Chưa có ngày"); mục có thể gắn với một địa điểm trong kho.
-- day_date: NULL = chưa có ngày. Mục nằm ngoài khoảng ngày mới của chuyến (kể cả đã xóa mềm) tự về NULL ở domain (R12 mới).
ALTER TABLE items ALTER COLUMN day_date DROP NOT NULL;

-- place_id: mã địa điểm trong kho biên tập (module catalog). Không có khóa ngoại: hai bounded context chỉ tham chiếu bằng
-- mã (ADR-003). Dạng slug, tối đa 60 ký tự như Place.id ở catalog.
ALTER TABLE items ADD COLUMN place_id varchar(60)
    CHECK (place_id IS NULL OR place_id ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
