package com.wander.planning.domain.constant;

/** Mã lỗi riêng của module planning (hợp đồng API, khớp {@code web/src/api.ts}). Mã dùng chung ở {@code ErrorCodes}. */
public final class PlanningErrorCodes {

    /** Ngày không phải ngày lịch hợp lệ. */
    public static final String INVALID_DATE = "INVALID_DATE";

    /** Thiếu ngày bắt đầu. */
    public static final String START_REQUIRED = "START_REQUIRED";

    /** Thiếu ngày kết thúc. */
    public static final String END_REQUIRED = "END_REQUIRED";

    /** Ngày kết thúc trước ngày bắt đầu. */
    public static final String END_BEFORE_START = "END_BEFORE_START";

    /** Loại mục không hợp lệ. */
    public static final String INVALID_TYPE = "INVALID_TYPE";

    /** Trạng thái đặt chỗ không hợp lệ. */
    public static final String INVALID_BOOKING = "INVALID_BOOKING";

    /** Kiểu chuyến không hợp lệ. */
    public static final String INVALID_STYLE = "INVALID_STYLE";

    /** Nhịp chuyến không hợp lệ. */
    public static final String INVALID_PACE = "INVALID_PACE";

    /** Một mục xuất hiện hai lần trong cùng một lệnh gán ngày hàng loạt. */
    public static final String DUPLICATE_ASSIGNMENT = "DUPLICATE_ASSIGNMENT";

    /** Thứ tự sắp xếp không đúng tập mục đang hiện trong ngày. */
    public static final String INVALID_ORDER = "INVALID_ORDER";

    /** Ngày nằm ngoài khoảng ngày của chuyến. */
    public static final String DAY_OUT_OF_RANGE = "DAY_OUT_OF_RANGE";

    /** Mục đã bị xóa nên không sửa được. */
    public static final String ITEM_DELETED = "ITEM_DELETED";

    /** Mục đã bị xóa rồi. */
    public static final String ALREADY_DELETED = "ALREADY_DELETED";

    /** Mục chưa bị xóa nên không khôi phục được. */
    public static final String NOT_DELETED = "NOT_DELETED";

    /** Mục chưa nằm trong "Đã xóa gần đây" nên chưa xóa vĩnh viễn được. */
    public static final String NOT_IN_TRASH = "NOT_IN_TRASH";

    /** Chỉ mục "Việc cần làm" mới có ô tích. */
    public static final String NOT_A_TASK = "NOT_A_TASK";

    /** Loại mục này không có trạng thái đặt chỗ. */
    public static final String BOOKING_NOT_APPLICABLE = "BOOKING_NOT_APPLICABLE";

    /** Giá tham khảo chỉ hợp lệ khi đã tick "đã bao gồm". */
    public static final String REFERENCE_REQUIRES_INCLUDED = "REFERENCE_REQUIRES_INCLUDED";

    private PlanningErrorCodes() {
    }
}
