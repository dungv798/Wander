-- Lát 1b (DR-021 H2): thành viên đề nghị xóa mục của người khác, Organizer duyệt.
-- Mục bị xóa vĩnh viễn thì đề nghị của nó mất theo (ON DELETE CASCADE). Mỗi mục tối đa một đề nghị đang chờ (lưới an toàn ở CSDL).
CREATE TABLE deletion_requests (
    id                   uuid PRIMARY KEY,
    trip_id              uuid NOT NULL REFERENCES trips(id),
    item_id              uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    requester_member_id  uuid NOT NULL,
    reason               varchar(800) NOT NULL DEFAULT '',
    status               varchar(16) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_at         timestamptz NOT NULL,
    decided_at           timestamptz
);
CREATE UNIQUE INDEX uq_deletion_requests_pending_item ON deletion_requests (item_id) WHERE status = 'pending';
CREATE INDEX idx_deletion_requests_trip ON deletion_requests (trip_id);
