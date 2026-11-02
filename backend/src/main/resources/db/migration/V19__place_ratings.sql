-- Rating Wander cho quán (DR-032): mỗi danh tính một điểm 1–5 và lời bình ngắn tùy chọn cho mỗi quán.
-- Không có khóa ngoại sang identities (module rating giữ dữ liệu riêng, ADR-003). place_ref là mã quán trong catalog/POI.
CREATE TABLE place_ratings (
    id          uuid PRIMARY KEY,
    identity_id uuid        NOT NULL,
    place_ref   varchar(64) NOT NULL,
    stars       integer     NOT NULL CHECK (stars BETWEEN 1 AND 5),
    comment     varchar(280),
    created_at  timestamptz NOT NULL,
    updated_at  timestamptz NOT NULL,
    CONSTRAINT uq_place_ratings_identity_place UNIQUE (identity_id, place_ref)
);
CREATE INDEX idx_place_ratings_place ON place_ratings (place_ref, updated_at DESC);

-- Báo cáo lời bình: đủ số người báo cáo khác nhau thì ẩn lời bình (điểm sao vẫn tính).
CREATE TABLE place_rating_reports (
    id          bigserial PRIMARY KEY,
    rating_id   uuid        NOT NULL REFERENCES place_ratings (id) ON DELETE CASCADE,
    reporter_id uuid        NOT NULL,
    created_at  timestamptz NOT NULL,
    CONSTRAINT uq_rating_report UNIQUE (rating_id, reporter_id)
);
