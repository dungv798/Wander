package com.wander.planning.domain.constant;

/** Error messages specific to the planning module (Vietnamese, for the user). Shared messages are in {@code ErrorMessages}. */
public final class PlanningMessages {
    /** The cover does not match the existing code contract. */
    public static final String INVALID_COVER = "Bìa không hợp lệ. Hãy chọn ảnh hoặc màu có sẵn.";

    /** The trip's date range is wrong (missing, wrong format, reversed, too long). */
    public static final String TRIP_RANGE_INVALID = "Khoảng ngày của chuyến không hợp lệ.";

    /** The item's date is not valid. */
    public static final String DAY_INVALID = "Ngày không hợp lệ.";

    /** The item type is not valid. */
    public static final String TYPE_INVALID = "Loại mục không hợp lệ.";

    /** The booking status is not valid. */
    public static final String BOOKING_INVALID = "Trạng thái đặt chỗ không hợp lệ.";

    /** The trip kind is not valid. */
    public static final String STYLE_INVALID = "Kiểu chuyến không hợp lệ.";

    /** 'Who is going' is not valid. */
    public static final String KIND_INVALID = "Kiểu người đi không hợp lệ.";

    /** The interest is not valid. */
    public static final String INTEREST_INVALID = "Sở thích không hợp lệ.";

    /** The trip pace is not valid. */
    public static final String PACE_INVALID = "Nhịp chuyến không hợp lệ.";

    /** A field is required but empty. */
    public static final String FIELD_REQUIRED = "Trường này là bắt buộc.";

    /** The date-assignment list has the wrong shape (not a list of objects). */
    public static final String ASSIGNMENTS_MALFORMED = "Danh sách gán ngày không hợp lệ.";

    /** An item appears twice in the date-assignment command. */
    public static final String ASSIGNMENT_DUPLICATED = "Mỗi mục chỉ được xuất hiện một lần trong lệnh gán ngày.";

    /** The submitted order has the wrong shape (not a list of strings). */
    public static final String ORDER_MALFORMED = "Thứ tự không hợp lệ.";

    /** The submitted order does not match the set of items visible in the day. */
    public static final String ORDER_MISMATCH = "Thứ tự phải gồm đúng các mục đang hiện trong ngày.";

    /** The date is outside the trip's date range. */
    public static final String DAY_OUT_OF_RANGE = "Ngày nằm ngoài khoảng ngày của chuyến.";

    /** The item has been deleted so it cannot be edited. */
    public static final String ITEM_DELETED_EDIT = "Mục đã bị xóa. Hãy khôi phục trước khi sửa.";

    /** The trip has already been deleted. */
    public static final String TRIP_DELETED = "Chuyến đi đã bị xóa.";

    /** The trip has not been deleted so it cannot be restored. */
    public static final String TRIP_NOT_DELETED = "Chuyến đi chưa bị xóa.";

    /** The trip's 'Recently deleted' is full (DR-020). */
    public static final String TRASH_FULL = "Đã xóa gần đây đã đầy. Hãy xóa vĩnh viễn bớt mục rồi thử lại.";

    /** The item has been deleted (a general message). */
    public static final String ITEM_DELETED = "Mục đã bị xóa.";

    /** The item has not been deleted. */
    public static final String NOT_DELETED = "Mục này chưa bị xóa.";

    /** Only an item that is already in 'Recently deleted' can be permanently deleted. */
    public static final String NOT_IN_TRASH = "Chỉ xóa vĩnh viễn được mục đã nằm trong \"Đã xóa gần đây\".";

    /** The item is not a to-do or a place so it does not accept a completion action. */
    public static final String NOT_A_TASK = "Chỉ việc cần làm và mục địa điểm mới có thể đánh dấu hoàn thành.";

    /** This item type has no booking status. */
    public static final String BOOKING_NOT_APPLICABLE = "Loại mục này không có trạng thái đặt chỗ.";

    /** Programming error: DateRange must be created through {@code DateRange.of}. */
    public static final String DATE_RANGE_FACTORY_REQUIRED = "DateRange must be created through DateRange.of";

    /** Data error: an unknown trip kind in the database; parameter: the code. */
    public static final String UNKNOWN_TRIP_STYLE = "Unknown trip style in database: %s";

    /** Data error: an unknown 'who is going' in the database; parameter: the code. */
    public static final String UNKNOWN_TRIP_KIND = "Unknown trip kind in database: %s";

    /** Data error: an unknown interest in the database; parameter: the code. */
    public static final String UNKNOWN_TRIP_INTEREST = "Unknown trip interest in database: %s";

    /** Data error: an unknown trip pace in the database; parameter: the code. */
    public static final String UNKNOWN_TRIP_PACE = "Unknown trip pace in database: %s";

    /** Data error: an unknown item type in the database; parameter: the code. */
    public static final String UNKNOWN_ITEM_TYPE = "Unknown item type in database: %s";

    /** Data error: an unknown booking status in the database; parameter: the code. */
    public static final String UNKNOWN_BOOKING_STATUS = "Unknown booking status in database: %s";

    private PlanningMessages() {
    }

    /** An unknown role in the data (a data error, not a user error). */
    public static final String UNKNOWN_MEMBER_ROLE = "Unknown member role in database: %s";

    /** The invite link cannot be used (one common message). */
    public static final String INVALID_INVITE = "Liên kết mời không hợp lệ hoặc đã hết hạn.";

    /** The trip is full. */
    public static final String TRIP_FULL = "Chuyến đi đã đủ số người tối đa.";

    /** Organizer only. */
    public static final String NOT_ORGANIZER = "Chỉ Organizer của chuyến làm được việc này.";

    /** You can edit only your own item. */
    public static final String NOT_YOUR_ITEM = "Bạn chỉ sửa hay xóa được mục do chính bạn thêm.";

    /** The Organizer does not leave the trip. */
    public static final String ORGANIZER_CANNOT_LEAVE = "Organizer không rời hay bị gỡ khỏi chuyến của mình.";

    /** The display name is empty. */
    public static final String DISPLAY_NAME_REQUIRED = "Hãy nhập tên hiển thị.";

    /** Your own item is deleted directly. */
    public static final String OWN_ITEM_DELETE_DIRECTLY = "Mục do bạn thêm thì bạn xóa thẳng được, không cần đề nghị.";

    /** The Organizer deletes directly. */
    public static final String ORGANIZER_DELETES_DIRECTLY = "Organizer xóa thẳng được, không cần đề nghị.";

    /** A request already exists. */
    public static final String REQUEST_EXISTS = "Mục này đã có đề nghị xóa đang chờ duyệt.";

    /** Too many pending requests. */
    public static final String TOO_MANY_REQUESTS = "Bạn đang có quá nhiều đề nghị xóa chờ duyệt.";

    /** Already decided. */
    public static final String ALREADY_DECIDED = "Đề nghị này đã được xử lý.";

    /** An unknown request status in the data (a data error). */
    public static final String UNKNOWN_REQUEST_STATUS = "Unknown deletion request status in database: %s";

    /** The item id is missing from the request. */
    public static final String ITEM_REQUIRED = "Hãy chọn mục cần đề nghị xóa.";

    /** The checklist is full. */
    public static final String CHECKLIST_FULL = "Checklist đã đủ số hạng mục tối đa.";

    /** The item name is empty. */
    public static final String CHECKLIST_TITLE_REQUIRED = "Hãy nhập tên hạng mục.";
}
