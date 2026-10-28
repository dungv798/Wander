-- Lát 1b (DR-021): thành viên + liên kết mời. Mỗi chuyến đúng một Organizer; tối đa MAX_MEMBERS và một liên kết chưa thu hồi do domain
-- giữ, ở đây là lưới an toàn cuối cùng ở mức CSDL.
CREATE TABLE trip_members (
    id            uuid PRIMARY KEY,
    trip_id       uuid NOT NULL REFERENCES trips(id),
    identity_id   uuid NOT NULL,
    role          varchar(16) NOT NULL CHECK (role IN ('organizer', 'member')),
    display_name  varchar(160) NOT NULL,
    joined_at     timestamptz NOT NULL,
    CONSTRAINT uq_trip_members_identity UNIQUE (trip_id, identity_id)
);
CREATE UNIQUE INDEX uq_trip_members_name ON trip_members (trip_id, lower(display_name));
CREATE UNIQUE INDEX uq_trip_members_organizer ON trip_members (trip_id) WHERE role = 'organizer';
CREATE INDEX idx_trip_members_identity ON trip_members (identity_id);

CREATE TABLE trip_invites (
    id          uuid PRIMARY KEY,
    trip_id     uuid NOT NULL REFERENCES trips(id),
    code_hash   varchar(128) NOT NULL,
    created_at  timestamptz NOT NULL,
    expires_at  timestamptz NOT NULL,
    revoked_at  timestamptz
);
CREATE UNIQUE INDEX uq_trip_invites_active ON trip_invites (trip_id) WHERE revoked_at IS NULL;
CREATE UNIQUE INDEX uq_trip_invites_code ON trip_invites (code_hash);

-- Dữ liệu có sẵn: chủ mỗi chuyến trở thành Organizer; mục cũ tính là của Organizer (added_by_member_id NULL).
INSERT INTO trip_members (id, trip_id, identity_id, role, display_name, joined_at)
SELECT gen_random_uuid(), id, owner_identity_id, 'organizer', 'Organizer', created_at FROM trips;

ALTER TABLE items ADD COLUMN added_by_member_id uuid;
