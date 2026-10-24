-- Wander schema v1 (PostgreSQL). Chuyển từ bản SQLite của server TypeScript cũ (server/src/api/db.ts),
-- giữ nguyên tên bảng/cột và các ràng buộc; bổ sung kiểu dữ liệu chặt hơn (uuid, date, timestamptz) và khóa lạc quan.

-- ============ Identity ============
CREATE TABLE identities (
    id          uuid PRIMARY KEY,
    created_at  timestamptz NOT NULL
);

CREATE TABLE sessions (
    id            uuid PRIMARY KEY,
    identity_id   uuid NOT NULL REFERENCES identities(id),
    token_hash    varchar(64) NOT NULL UNIQUE,
    created_at    timestamptz NOT NULL,
    last_seen_at  timestamptz NOT NULL,
    revoked_at    timestamptz
);
CREATE INDEX sessions_identity ON sessions(identity_id);

-- Mã khôi phục: chỉ lưu băm. Tối đa một mã hợp lệ cho mỗi danh tính (D22, INV-13).
CREATE TABLE recovery_codes (
    id                  uuid PRIMARY KEY,
    identity_id         uuid NOT NULL REFERENCES identities(id),
    code_hash           varchar(64) NOT NULL UNIQUE,
    created_at          timestamptz NOT NULL,
    invalidated_at      timestamptz,
    invalidated_reason  varchar(32)
);
CREATE UNIQUE INDEX recovery_codes_one_active ON recovery_codes(identity_id) WHERE invalidated_at IS NULL;

-- Lần thử khôi phục (KP-C, D24): mã cũ chỉ vô hiệu khi mã thay thế được xác nhận (commit).
CREATE TABLE recovery_attempts (
    id                  uuid PRIMARY KEY,
    attempt_key         varchar(128) NOT NULL UNIQUE,
    identity_id         uuid NOT NULL REFERENCES identities(id),
    old_code_id         uuid NOT NULL REFERENCES recovery_codes(id),
    replacement_hash    varchar(64) NOT NULL,
    session_token_hash  varchar(64) NOT NULL,
    state               varchar(16) NOT NULL CHECK (state IN ('pending', 'committed', 'failed', 'expired')),
    created_at          timestamptz NOT NULL,
    expires_at          timestamptz NOT NULL
);
CREATE INDEX recovery_attempts_token ON recovery_attempts(session_token_hash) WHERE state = 'pending';

-- Phát hành hoặc tái tạo mã từ một phiên hợp lệ (hai pha, D23/D25).
CREATE TABLE code_replacements (
    id                uuid PRIMARY KEY,
    identity_id       uuid NOT NULL REFERENCES identities(id),
    session_id        uuid NOT NULL REFERENCES sessions(id),
    old_code_id       uuid REFERENCES recovery_codes(id),
    replacement_hash  varchar(64) NOT NULL,
    state             varchar(16) NOT NULL CHECK (state IN ('pending', 'committed', 'void')),
    created_at        timestamptz NOT NULL,
    expires_at        timestamptz NOT NULL
);
CREATE INDEX code_replacements_identity ON code_replacements(identity_id) WHERE state = 'pending';

-- Thiết bị tin cậy duyệt thiết bị mới (D21). Bí mật phiên do thiết bị mới tự sinh; server chỉ giữ băm.
CREATE TABLE device_links (
    id                  uuid PRIMARY KEY,
    pairing_code        varchar(9) NOT NULL,
    session_token_hash  varchar(64) NOT NULL,
    state               varchar(16) NOT NULL CHECK (state IN ('pending', 'approved', 'expired')),
    identity_id         uuid REFERENCES identities(id),
    created_at          timestamptz NOT NULL,
    expires_at          timestamptz NOT NULL
);
CREATE INDEX device_links_pairing ON device_links(pairing_code) WHERE state = 'pending';

-- Xác thực lại bằng phê duyệt từ thiết bị tin cậy khác (D25).
CREATE TABLE step_up_requests (
    id                   uuid PRIMARY KEY,
    identity_id          uuid NOT NULL REFERENCES identities(id),
    session_id           uuid NOT NULL REFERENCES sessions(id),
    operation            varchar(32) NOT NULL,
    approval_code        varchar(9) NOT NULL,
    state                varchar(16) NOT NULL CHECK (state IN ('pending', 'approved', 'consumed')),
    approved_by_session  uuid REFERENCES sessions(id),
    created_at           timestamptz NOT NULL,
    expires_at           timestamptz NOT NULL
);

-- ============ Planning ============
-- owner_identity_id KHÔNG có khóa ngoại sang identities: hai bounded context giữ dữ liệu riêng,
-- chỉ tham chiếu bằng định danh (tách được thành service riêng về sau).
CREATE TABLE trips (
    id                 uuid PRIMARY KEY,
    owner_identity_id  uuid NOT NULL,
    name               varchar(120) NOT NULL,
    destination        varchar(200) NOT NULL,
    start_date         date NOT NULL,
    end_date           date NOT NULL CHECK (end_date >= start_date),
    created_at         timestamptz NOT NULL,
    updated_at         timestamptz NOT NULL,
    version            bigint NOT NULL DEFAULT 0
);
CREATE INDEX trips_owner ON trips(owner_identity_id);

CREATE TABLE items (
    id            uuid PRIMARY KEY,
    trip_id       uuid NOT NULL REFERENCES trips(id),
    day_date      date NOT NULL,
    position      integer NOT NULL,
    type          varchar(32) NOT NULL CHECK (type IN ('sightseeing', 'food', 'transport', 'lodging', 'car_rental',
                                                     'shopping', 'tour', 'rest', 'task')),
    title         varchar(200) NOT NULL,
    time_of_day   time,
    duration_min  integer CHECK (duration_min IS NULL OR (duration_min >= 0 AND duration_min <= 10080)),
    note          varchar(2000),
    cost_k        bigint CHECK (cost_k IS NULL OR (cost_k >= 0 AND cost_k <= 1000000000)),
    included      boolean NOT NULL DEFAULT false,
    reference_k   bigint CHECK (reference_k IS NULL OR (reference_k >= 0 AND reference_k <= 1000000000)),
    deleted_at    timestamptz,
    created_at    timestamptz NOT NULL,
    updated_at    timestamptz NOT NULL,
    -- Q18(f): giá tham khảo chỉ có khi đã tick "đã bao gồm".
    CHECK (included OR reference_k IS NULL)
);
CREATE INDEX items_trip_day ON items(trip_id, day_date);

-- Hoàn thành theo cặp (việc × người) để Lát 1b không phải đổi mô hình (đề xuất P5).
CREATE TABLE item_completions (
    item_id    uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    person_id  uuid NOT NULL,
    done_at    timestamptz NOT NULL,
    PRIMARY KEY (item_id, person_id)
);
