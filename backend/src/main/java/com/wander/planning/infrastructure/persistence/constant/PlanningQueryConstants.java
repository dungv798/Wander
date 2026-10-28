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

    /** Tham số: băm mã liên kết mời. */
    public static final String PARAM_CODE_HASH = "codeHash";

    /** Tham số: mã người hoàn thành. */
    public static final String PARAM_PERSON = "person";

    /** Chọn các cột của chuyến thành dòng phẳng {@code TripRow} (constructor expression). */
    public static final String TRIP_ROW = "select new com.wander.planning.application.query.TripRow("
            + "t.id, t.ownerIdentityId, t.name, t.destination, t.startDate, t.endDate, t.budgetK, t.styles, t.pace, t.datesTentative, t.kind, t.interests, "
            + "t.createdAt, t.updatedAt, t.deletedAt, "
            + "(select m.role from TripMemberEntity m where m.trip = t and m.identityId = :" + PARAM_OWNER + "), "
            + "(select count(m2) from TripMemberEntity m2 where m2.trip = t)) "
            + "from TripEntity t ";

    /** Chọn các cột của mục thành dòng phẳng {@code ItemRow} (constructor expression). */
    public static final String ITEM_ROW = "select new com.wander.planning.application.query.ItemRow("
            + "i.id, i.trip.id, i.dayDate, i.position, i.type, i.title, i.timeOfDay, i.durationMin, i.note, "
            + "i.costK, i.included, i.referenceK, i.bookingStatus, i.placeId, i.deletedAt, i.createdAt, i.addedByMemberId) from ItemEntity i ";

    /** Điều kiện: người này là thành viên của chuyến (mọi vai). */
    public static final String IS_MEMBER = "exists (select 1 from TripMemberEntity mm where mm.trip = t and mm.identityId = :" + PARAM_OWNER + ")";

    /** Điều kiện: chuyến CÒN HIỆN theo mã mà người gọi là thành viên (người ngoài và chuyến đã xóa mềm coi như không có). */
    public static final String WHERE_TRIP_OF_OWNER = "where t.id = :" + PARAM_TRIP_ID + " and " + IS_MEMBER + " and t.deletedAt is null";

    /** Điều kiện chuyến ĐÃ XÓA MỀM theo mã của đúng chủ (chỉ Organizer thấy chuyến đã xóa). */
    public static final String WHERE_DELETED_TRIP_OF_OWNER = "where t.id = :" + PARAM_TRIP_ID + " and t.ownerIdentityId = :" + PARAM_OWNER + " and t.deletedAt is not null";

    /** Điều kiện và thứ tự: mọi chuyến của chủ, mới nhất trước. */
    public static final String WHERE_OWNER_NEWEST_FIRST =
            "where " + IS_MEMBER + " and t.deletedAt is null order by t.startDate desc, t.createdAt desc";

    /** Điều kiện và thứ tự: chuyến đã xóa mềm của chủ, xóa gần nhất trước. */
    public static final String WHERE_OWNER_DELETED_RECENT_FIRST =
            "where t.ownerIdentityId = :" + PARAM_OWNER + " and t.deletedAt is not null order by t.deletedAt desc, t.id";

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
            + "where t.id = :" + PARAM_TRIP_ID + " and t.deletedAt is null and exists (select 1 from TripMemberEntity mm where mm.trip = t and mm.identityId = :" + PARAM_OWNER + ")";

    /** Nạp chuyến ĐÃ XÓA MỀM của chủ kèm mục (để khôi phục). */
    public static final String TRIP_WITH_ITEMS_DELETED = "select distinct t from TripEntity t left join fetch t.items "
            + "where t.id = :" + PARAM_TRIP_ID + " and t.ownerIdentityId = :" + PARAM_OWNER + " and t.deletedAt is not null";

    /** Chuyến còn hiện có liên kết mời với băm mã này (kể cả liên kết hết hạn/thu hồi: domain quyết định). */
    public static final String TRIP_BY_INVITE_HASH = "select distinct t from TripEntity t left join fetch t.items where t.deletedAt is null "
            + "and exists (select 1 from TripInviteEntity i where i.trip = t and i.codeHash = :" + PARAM_CODE_HASH + ")";

    /** Mọi thành viên của chuyến, theo thứ tự vào. */
    public static final String MEMBERS_OF_TRIP = "select new com.wander.planning.application.query.MemberRow(m.id, m.identityId, m.role, m.displayName, m.joinedAt) "
            + "from TripMemberEntity m where m.trip.id = :" + PARAM_TRIP + " order by m.joinedAt, m.id";

    /** Liên kết mời chưa thu hồi của chuyến (tối đa một). */
    public static final String UNREVOKED_INVITE_OF_TRIP = "select new com.wander.planning.application.query.InviteRow(i.id, i.createdAt, i.expiresAt, i.revokedAt) "
            + "from TripInviteEntity i where i.trip.id = :" + PARAM_TRIP + " and i.revokedAt is null";

    /** Tham số: thời điểm hiện tại. */
    public static final String PARAM_NOW = "now";

    /** Xem trước liên kết mời còn dùng được: tên chuyến và số thành viên. */
    public static final String INVITE_PREVIEW = "select new com.wander.planning.application.query.InvitePreviewRow(t.name, (select count(m) from TripMemberEntity m where m.trip = t)) "
            + "from TripEntity t where t.deletedAt is null and exists (select 1 from TripInviteEntity i where i.trip = t and i.codeHash = :" + PARAM_CODE_HASH
            + " and i.revokedAt is null and i.expiresAt > :" + PARAM_NOW + ")";

    private PlanningQueryConstants() {
    }
}
