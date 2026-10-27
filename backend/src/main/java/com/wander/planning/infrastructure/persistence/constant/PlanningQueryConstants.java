package com.wander.planning.infrastructure.persistence.constant;

/** Câu JPQL và tên tham số của phía đọc/ghi Planning (tầng CHỨC NĂNG). Tên tham số {@code :x} khớp {@code setParameter("x")}. */
public final class PlanningQueryConstants {

    /** Tham số: mã chuyến. */
    public static final String PARAM_TRIP_ID = "id";

    /** Tham số: mã danh tính chủ chuyến. */
    public static final String PARAM_OWNER = "owner";

    /** Tham số: mã chuyến khi lọc mục. */
    public static final String PARAM_TRIP = "trip";

    /** Tham số: mã mục. */
    public static final String PARAM_ITEM_ID = "id";

    /** Tham số: mã người hoàn thành. */
    public static final String PARAM_PERSON = "person";

    /** Chọn các cột của chuyến thành dòng phẳng {@code TripRow} (constructor expression). */
    public static final String TRIP_ROW = "select new com.wander.planning.application.query.TripRow("
            + "t.id, t.ownerIdentityId, t.name, t.destination, t.startDate, t.endDate, t.budgetK, t.styles, t.pace, t.datesTentative, t.kind, t.interests, "
            + "t.createdAt, t.updatedAt) "
            + "from TripEntity t ";

    /** Chọn các cột của mục thành dòng phẳng {@code ItemRow} (constructor expression). */
    public static final String ITEM_ROW = "select new com.wander.planning.application.query.ItemRow("
            + "i.id, i.trip.id, i.dayDate, i.position, i.type, i.title, i.timeOfDay, i.durationMin, i.note, "
            + "i.costK, i.included, i.referenceK, i.bookingStatus, i.placeId, i.deletedAt, i.createdAt) from ItemEntity i ";

    /** Điều kiện: chuyến theo mã và chủ. */
    public static final String WHERE_TRIP_OF_OWNER = "where t.id = :" + PARAM_TRIP_ID + " and t.ownerIdentityId = :" + PARAM_OWNER;

    /** Điều kiện và thứ tự: mọi chuyến của chủ, mới nhất trước. */
    public static final String WHERE_OWNER_NEWEST_FIRST =
            "where t.ownerIdentityId = :" + PARAM_OWNER + " order by t.startDate desc, t.createdAt desc";

    /** Điều kiện và thứ tự: mọi mục của chuyến, theo ngày rồi vị trí thủ công. */
    public static final String WHERE_TRIP_ITEMS_IN_ORDER =
            "where i.trip.id = :" + PARAM_TRIP + " order by i.dayDate, i.position, i.createdAt, i.id";

    /** Điều kiện: một mục của chuyến theo mã. */
    public static final String WHERE_TRIP_ITEM = "where i.trip.id = :" + PARAM_TRIP + " and i.id = :" + PARAM_ITEM_ID;

    /** Điều kiện và thứ tự: mục đã xóa mềm của chuyến, xóa gần nhất trước. */
    public static final String WHERE_TRIP_TRASH =
            "where i.trip.id = :" + PARAM_TRIP + " and i.deletedAt is not null order by i.deletedAt desc, i.id";

    /** Mã các mục mà một người đã hoàn thành trong chuyến. */
    public static final String DONE_ITEM_IDS = "select i.id from ItemEntity i join i.completions c "
            + "where i.trip.id = :" + PARAM_TRIP + " and c.personId = :" + PARAM_PERSON;

    /** Sở thích theo danh tính của chủ (BE-10). */
    public static final String OWNER_INTEREST_PREFERENCES =
            "select p.interests from OwnerPreferencesEntity p where p.ownerIdentityId = :" + PARAM_OWNER;

    /** Ghi hoặc thay sở thích theo danh tính bằng một câu nguyên tử (SQL thuần vì cần ON CONFLICT). */
    public static final String UPSERT_OWNER_INTERESTS = "INSERT INTO owner_preferences (owner_identity_id, interests, updated_at) "
            + "VALUES (:owner, :interests, :now) ON CONFLICT (owner_identity_id) DO UPDATE "
            + "SET interests = EXCLUDED.interests, updated_at = EXCLUDED.updated_at";

    /** Mã và tên mọi chuyến của chủ (để đặt tên không trùng). */
    public static final String TRIP_NAMES = "select t.id, t.name from TripEntity t where t.ownerIdentityId = :" + PARAM_OWNER;

    /** Nạp chuyến của chủ kèm mọi mục trong một truy vấn (tránh N+1). */
    public static final String TRIP_WITH_ITEMS = "select distinct t from TripEntity t left join fetch t.items "
            + "where t.id = :" + PARAM_TRIP_ID + " and t.ownerIdentityId = :" + PARAM_OWNER;

    private PlanningQueryConstants() {
    }
}
