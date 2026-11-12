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

    /** Danh sách chuyến đã xóa mềm. */
    public static final String DELETED_TRIPS_PATH = "/deleted";

    /** Khôi phục một chuyến đã xóa mềm. */
    public static final String TRIP_RESTORE_PATH = TRIP_PATH + "/restore";

    /** Sở thích theo danh tính (BE-10). */
    public static final String PREFERENCES_PATH = "/api/preferences";

    /** Phần đường dẫn của sở thích. */
    public static final String INTERESTS_PATH = "/interests";

    private PlanningApiConstants() {
    }

    /** Liên kết mời của một chuyến. */
    public static final String INVITES_PATH = TRIP_PATH + "/invites";

    /** Liên kết mời đang dùng (để thu hồi). */
    public static final String INVITE_ACTIVE_PATH = INVITES_PATH + "/active";

    /** Thành viên của một chuyến. */
    public static final String MEMBERS_PATH = TRIP_PATH + "/members";

    /** Một thành viên theo mã. */
    public static final String MEMBER_PATH = MEMBERS_PATH + "/{memberId}";

    /** Chính người gọi trong chuyến. */
    public static final String MEMBER_ME_PATH = MEMBERS_PATH + "/me";

    /** Gốc API liên kết mời không gắn với một chuyến cụ thể. */
    public static final String INVITES_BASE_PATH = "/api/invites";

    /** Xem trước liên kết (công khai, có hạn mức). */
    public static final String INVITE_PREVIEW_PATH = "/preview";

    /** Vào chuyến bằng liên kết (cần phiên). */
    public static final String INVITE_JOIN_PATH = "/join";

    /** Tên đoạn đường dẫn "me" dùng cho thành viên hiện tại. */
    public static final String ME = "me";

    /** Đề nghị xóa của một chuyến. */
    public static final String REQUESTS_PATH = TRIP_PATH + "/deletion-requests";

    /** Một đề nghị theo mã. */
    public static final String REQUEST_PATH = REQUESTS_PATH + "/{requestId}";

    /** Đồng ý đề nghị. */
    public static final String REQUEST_APPROVE_PATH = REQUEST_PATH + "/approve";

    /** Từ chối đề nghị. */
    public static final String REQUEST_REJECT_PATH = REQUEST_PATH + "/reject";

    /** Checklist chuẩn bị của một chuyến. */
    public static final String CHECKLIST_PATH = TRIP_PATH + "/checklist";

    /** Một hạng mục checklist. */
    public static final String CHECKLIST_ITEM_PATH = CHECKLIST_PATH + "/{itemId}";

    /** Dấu hoàn thành của chính mình trên một hạng mục checklist. */
    public static final String CHECKLIST_DONE_PATH = CHECKLIST_ITEM_PATH + "/done";
}
