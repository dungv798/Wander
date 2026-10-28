package com.wander.planning.domain.constant;

/** Tên các trường JSON của API Planning (hợp đồng, khớp {@code web/src/api.ts}); cũng dùng làm tên trường trong lỗi. */
public final class PlanningFields {

    /** Tên chuyến. */
    public static final String NAME = "name";

    /** Điểm đến. */
    public static final String DESTINATION = "destination";

    /** Ngày bắt đầu. */
    public static final String START_DATE = "startDate";

    /** Ngày kết thúc. */
    public static final String END_DATE = "endDate";

    /** Ngân sách dự kiến. */
    public static final String BUDGET = "budget";

    /** Kiểu chuyến. */
    public static final String STYLES = "styles";

    /** Nhịp chuyến. */
    public static final String PACE = "pace";

    /** Ngày của mục. */
    public static final String DAY = "day";

    /** Loại mục. */
    public static final String TYPE = "type";

    /** Tiêu đề mục. */
    public static final String TITLE = "title";

    /** Giờ trong ngày. */
    public static final String TIME_OF_DAY = "timeOfDay";

    /** Thời lượng, phút. */
    public static final String DURATION_MIN = "durationMin";

    /** Ghi chú. */
    public static final String NOTE = "note";

    /** Trạng thái đặt chỗ. */
    public static final String BOOKING = "booking";

    /** Vị trí trong ngày. */
    public static final String POSITION = "position";

    /** Chi phí. */
    public static final String COST = "cost";

    /** Đã bao gồm. */
    public static final String INCLUDED = "included";

    /** Giá tham khảo. */
    public static final String REFERENCE_COST = "referenceCost";

    /** Danh sách gán ngày hàng loạt của lệnh lịch. */
    public static final String ASSIGNMENTS = "assignments";

    /** Mã mục trong một phần tử gán ngày. */
    public static final String ITEM_ID = "itemId";

    /** "Ai đi" của chuyến (ADR-014). */
    public static final String KIND = "kind";

    /** Sở thích của chuyến (ADR-014). */
    public static final String INTERESTS = "interests";

    /** Cờ ngày đi/về chưa chắc (DR-018 A3). */
    public static final String DATES_TENTATIVE = "datesTentative";

    /** Mã địa điểm trong kho biên tập mà mục liên kết tới. */
    public static final String PLACE_ID = "placeId";

    /** Danh sách mã mục theo thứ tự mới. */
    public static final String ORDERED_IDS = "orderedIds";

    /** Đã hoàn thành. */
    public static final String DONE = "done";

    private PlanningFields() {
    }

    /** Tên hiển thị của thành viên. */
    public static final String DISPLAY_NAME = "displayName";

    /** Mã liên kết mời. */
    public static final String INVITE_CODE = "code";
}
