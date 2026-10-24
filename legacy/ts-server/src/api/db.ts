import { DatabaseSync } from 'node:sqlite';

const MIGRATIONS: ReadonlyArray<{ version: number; sql: string }> = [
  {
    version: 1,
    sql: `
CREATE TABLE identities (
  id          TEXT PRIMARY KEY,
  created_at  TEXT NOT NULL
);

CREATE TABLE sessions (
  id           TEXT PRIMARY KEY,
  identity_id  TEXT NOT NULL REFERENCES identities(id),
  token_hash   TEXT NOT NULL UNIQUE,
  created_at   TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  revoked_at   TEXT
);
CREATE INDEX sessions_identity ON sessions(identity_id);

CREATE TABLE trips (
  id                 TEXT PRIMARY KEY,
  owner_identity_id  TEXT NOT NULL REFERENCES identities(id),
  name               TEXT NOT NULL,
  destination        TEXT NOT NULL,
  start_date         TEXT NOT NULL,
  end_date           TEXT NOT NULL,
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL
);
CREATE INDEX trips_owner ON trips(owner_identity_id);

CREATE TABLE items (
  id            TEXT PRIMARY KEY,
  trip_id       TEXT NOT NULL REFERENCES trips(id),
  day_date      TEXT NOT NULL,
  position      INTEGER NOT NULL,
  type          TEXT NOT NULL,
  title         TEXT NOT NULL,
  time_of_day   TEXT,
  duration_min  INTEGER,
  note          TEXT,
  cost_k        INTEGER CHECK (cost_k IS NULL OR cost_k >= 0),
  included      INTEGER NOT NULL DEFAULT 0 CHECK (included IN (0, 1)),
  reference_k   INTEGER CHECK (reference_k IS NULL OR reference_k >= 0),
  deleted_at    TEXT,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);
CREATE INDEX items_trip_day ON items(trip_id, day_date);

-- Hoàn thành theo cặp (việc x người) để 1b không phải đổi mô hình (đề xuất P5, mặc định của implementation).
-- Ở 1a person_id luôn là danh tính chủ chuyến.
CREATE TABLE completions (
  item_id    TEXT NOT NULL REFERENCES items(id),
  person_id  TEXT NOT NULL,
  done_at    TEXT NOT NULL,
  PRIMARY KEY (item_id, person_id)
);
`,
  },
  {
    // Xác thực và khôi phục theo D20–D26 (release gate RG-1: chưa được PO duyệt thiết kế).
    version: 2,
    sql: `
-- Mã khôi phục: chỉ lưu băm. Tối đa một mã hợp lệ cho mỗi danh tính (D22, INV-13).
CREATE TABLE recovery_codes (
  id                  TEXT PRIMARY KEY,
  identity_id         TEXT NOT NULL REFERENCES identities(id),
  code_hash           TEXT NOT NULL UNIQUE,
  created_at          TEXT NOT NULL,
  invalidated_at      TEXT,
  invalidated_reason  TEXT
);
CREATE UNIQUE INDEX recovery_codes_one_active ON recovery_codes(identity_id) WHERE invalidated_at IS NULL;

-- Lần thử khôi phục (KP-C, D24): mã cũ chỉ vô hiệu khi mã thay thế được xác nhận (commit).
CREATE TABLE recovery_attempts (
  id                  TEXT PRIMARY KEY,
  attempt_key         TEXT NOT NULL UNIQUE,
  identity_id         TEXT NOT NULL REFERENCES identities(id),
  old_code_id         TEXT NOT NULL REFERENCES recovery_codes(id),
  replacement_hash    TEXT NOT NULL,
  session_token_hash  TEXT NOT NULL,
  state               TEXT NOT NULL CHECK (state IN ('pending', 'committed', 'failed', 'expired')),
  created_at          TEXT NOT NULL,
  expires_at          TEXT NOT NULL
);

-- Phát hành hoặc tái tạo mã từ một phiên hợp lệ (hai pha, D23/D25).
CREATE TABLE code_replacements (
  id                TEXT PRIMARY KEY,
  identity_id       TEXT NOT NULL REFERENCES identities(id),
  session_id        TEXT NOT NULL REFERENCES sessions(id),
  old_code_id       TEXT REFERENCES recovery_codes(id),
  replacement_hash  TEXT NOT NULL,
  state             TEXT NOT NULL CHECK (state IN ('pending', 'committed', 'void')),
  created_at        TEXT NOT NULL,
  expires_at        TEXT NOT NULL
);

-- Thiết bị tin cậy duyệt thiết bị mới (D21). Bí mật phiên do thiết bị mới tự sinh; server chỉ giữ băm.
CREATE TABLE device_links (
  id                  TEXT PRIMARY KEY,
  pairing_code        TEXT NOT NULL,
  session_token_hash  TEXT NOT NULL,
  state               TEXT NOT NULL CHECK (state IN ('pending', 'approved', 'expired')),
  identity_id         TEXT REFERENCES identities(id),
  created_at          TEXT NOT NULL,
  expires_at          TEXT NOT NULL
);

-- Xác thực lại bằng phê duyệt từ thiết bị tin cậy khác (D25).
CREATE TABLE step_up_requests (
  id                   TEXT PRIMARY KEY,
  identity_id          TEXT NOT NULL REFERENCES identities(id),
  session_id           TEXT NOT NULL REFERENCES sessions(id),
  operation            TEXT NOT NULL,
  approval_code        TEXT NOT NULL,
  state                TEXT NOT NULL CHECK (state IN ('pending', 'approved', 'consumed')),
  approved_by_session  TEXT REFERENCES sessions(id),
  created_at           TEXT NOT NULL,
  expires_at           TEXT NOT NULL
);
`,
  },
];

export function openDb(path: string): DatabaseSync {
  const db = new DatabaseSync(path);
  db.exec('PRAGMA foreign_keys = ON');
  if (path !== ':memory:') db.exec('PRAGMA journal_mode = WAL');
  migrate(db);
  return db;
}

export function migrate(db: DatabaseSync): void {
  db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)');
  const row = db.prepare('SELECT COALESCE(MAX(version), 0) AS v FROM schema_migrations').get() as { v: number };
  for (const m of MIGRATIONS) {
    if (m.version <= row.v) continue;
    tx(db, () => {
      db.exec(m.sql);
      db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)').run(
        m.version,
        new Date().toISOString(),
      );
    });
  }
}

export function tx<T>(db: DatabaseSync, fn: () => T): T {
  db.exec('BEGIN IMMEDIATE');
  try {
    const out = fn();
    db.exec('COMMIT');
    return out;
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}
