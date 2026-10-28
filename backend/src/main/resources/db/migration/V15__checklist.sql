-- Lát 1b (Q12): checklist chuẩn bị. Do Organizer tạo, mỗi người tick riêng. Xóa hạng mục là xóa hẳn (hạng mục nhẹ, có xác nhận ở giao diện).
CREATE TABLE checklist_items (
    id          uuid PRIMARY KEY,
    trip_id     uuid NOT NULL REFERENCES trips(id),
    group_title varchar(240) NOT NULL DEFAULT '',
    title       varchar(480) NOT NULL,
    position    integer NOT NULL,
    created_at  timestamptz NOT NULL
);
CREATE INDEX idx_checklist_items_trip ON checklist_items (trip_id, position);

CREATE TABLE checklist_completions (
    item_id   uuid NOT NULL REFERENCES checklist_items(id) ON DELETE CASCADE,
    person_id uuid NOT NULL,
    done_at   timestamptz NOT NULL,
    PRIMARY KEY (item_id, person_id)
);
