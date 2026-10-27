package com.wander.planning.api.constant;

/** Hằng số của API Planning (tầng CHỨC NĂNG): đường dẫn và khóa JSON của phản hồi (khớp {@code web/src/api.ts}). */
public final class PlanningApiConstants {

    /** Đường dẫn gốc của chuyến. */
    public static final String TRIPS_PATH = "/api/trips";

    /** Một chuyến theo mã. */
    public static final String TRIP_PATH = "/{tripId}";

    /** Các mục của một chuyến. */
    public static final String ITEMS_PATH = TRIP_PATH + "/items";

    /** Một mục theo mã. */
    public static final String ITEM_PATH = ITEMS_PATH + "/{itemId}";

    /** Khôi phục một mục đã xóa mềm. */
    public static final String ITEM_RESTORE_PATH = ITEM_PATH + "/restore";

    /** Xóa vĩnh viễn một mục. */
    public static final String ITEM_PERMANENT_PATH = ITEM_PATH + "/permanent";

    /** Đánh dấu hoàn thành một việc cần làm. */
    public static final String ITEM_DONE_PATH = ITEM_PATH + "/done";

    /** Sắp xếp lại các mục của một ngày. */
    public static final String DAY_REORDER_PATH = TRIP_PATH + "/days/{day}/reorder";

    /** Lệnh lịch: đổi khoảng ngày và/hoặc gán ngày hàng loạt nguyên tử (cũng dùng để Hoàn tác). */
    public static final String SCHEDULE_PATH = TRIP_PATH + "/schedule";

    /** Các mục trong "Đã xóa gần đây". */
    public static final String TRASH_PATH = TRIP_PATH + "/trash";

    /** Khóa JSON của danh sách chuyến. */
    public static final String KEY_TRIPS = "trips";

    /** Sở thích theo danh tính (BE-10). */
    public static final String PREFERENCES_PATH = "/api/preferences";

    /** Phần đường dẫn của sở thích. */
    public static final String INTERESTS_PATH = "/interests";

    /** Khóa JSON của danh sách sở thích. */
    public static final String KEY_INTERESTS = "interests";

    /** Khóa JSON của một chuyến. */
    public static final String KEY_TRIP = "trip";

    /** Khóa JSON của một mục. */
    public static final String KEY_ITEM = "item";

    /** Khóa JSON của danh sách mục. */
    public static final String KEY_ITEMS = "items";

    private PlanningApiConstants() {
    }
}
