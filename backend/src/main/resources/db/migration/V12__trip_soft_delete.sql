-- PO 28/10/2026: xóa mềm cả chuyến (D19). deleted_at NULL = chuyến còn hiện. Xóa vĩnh viễn chuyến cần xác thực lại (D25) nên chưa làm.
ALTER TABLE trips ADD COLUMN deleted_at timestamptz;
CREATE INDEX idx_trips_owner_deleted ON trips (owner_identity_id, deleted_at);
