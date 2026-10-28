package com.wander.planning.domain.constant;

/** Lời báo lỗi riêng của module planning (tiếng Việt cho người dùng). Lời dùng chung ở {@code ErrorMessages}. */
public final class PlanningMessages {

    /** Khoảng ngày của chuyến sai (thiếu, sai định dạng, ngược, quá dài). */
    public static final String TRIP_RANGE_INVALID = "Khoảng ngày của chuyến không hợp lệ.";

    /** Ngày của mục không hợp lệ. */
    public static final String DAY_INVALID = "Ngày không hợp lệ.";

    /** Loại mục không hợp lệ. */
    public static final String TYPE_INVALID = "Loại mục không hợp lệ.";

    /** Trạng thái đặt chỗ không hợp lệ. */
    public static final String BOOKING_INVALID = "Trạng thái đặt chỗ không hợp lệ.";

    /** Kiểu chuyến không hợp lệ. */
    public static final String STYLE_INVALID = "Kiểu chuyến không hợp lệ.";

    /** "Ai đi" không hợp lệ. */
    public static final String KIND_INVALID = "Kiểu người đi không hợp lệ.";

    /** Sở thích không hợp lệ. */
    public static final String INTEREST_INVALID = "Sở thích không hợp lệ.";

    /** Nhịp chuyến không hợp lệ. */
    public static final String PACE_INVALID = "Nhịp chuyến không hợp lệ.";

    /** Trường bắt buộc nhưng trống. */
    public static final String FIELD_REQUIRED = "Trường này là bắt buộc.";

    /** Danh sách gán ngày sai dạng (không phải danh sách đối tượng). */
    public static final String ASSIGNMENTS_MALFORMED = "Danh sách gán ngày không hợp lệ.";

    /** Một mục xuất hiện hai lần trong lệnh gán ngày. */
    public static final String ASSIGNMENT_DUPLICATED = "Mỗi mục chỉ được xuất hiện một lần trong lệnh gán ngày.";

    /** Thứ tự gửi lên sai dạng (không phải danh sách chuỗi). */
    public static final String ORDER_MALFORMED = "Thứ tự không hợp lệ.";

    /** Thứ tự gửi lên không đúng tập mục đang hiện trong ngày. */
    public static final String ORDER_MISMATCH = "Thứ tự phải gồm đúng các mục đang hiện trong ngày.";

    /** Ngày nằm ngoài khoảng ngày của chuyến. */
    public static final String DAY_OUT_OF_RANGE = "Ngày nằm ngoài khoảng ngày của chuyến.";

    /** Mục đã bị xóa nên không sửa được. */
    public static final String ITEM_DELETED_EDIT = "Mục đã bị xóa. Hãy khôi phục trước khi sửa.";

    /** Chuyến đã bị xóa rồi. */
    public static final String TRIP_DELETED = "Chuyến đi đã bị xóa.";

    /** Chuyến chưa bị xóa nên không khôi phục được. */
    public static final String TRIP_NOT_DELETED = "Chuyến đi chưa bị xóa.";

    /** "Đã xóa gần đây" của chuyến đã đầy (DR-020). */
    public static final String TRASH_FULL = "Đã xóa gần đây đã đầy. Hãy xóa vĩnh viễn bớt mục rồi thử lại.";

    /** Mục đã bị xóa (thông báo chung). */
    public static final String ITEM_DELETED = "Mục đã bị xóa.";

    /** Mục chưa bị xóa. */
    public static final String NOT_DELETED = "Mục này chưa bị xóa.";

    /** Chỉ xóa vĩnh viễn được mục đã nằm trong "Đã xóa gần đây". */
    public static final String NOT_IN_TRASH = "Chỉ xóa vĩnh viễn được mục đã nằm trong \"Đã xóa gần đây\".";

    /** Chỉ mục "Việc cần làm" mới có ô tích. */
    public static final String NOT_A_TASK = "Chỉ mục loại \"Việc cần làm\" mới có ô tích.";

    /** Loại mục này không có trạng thái đặt chỗ. */
    public static final String BOOKING_NOT_APPLICABLE = "Loại mục này không có trạng thái đặt chỗ.";

    /** Lỗi lập trình: DateRange phải tạo qua {@code DateRange.of}. */
    public static final String DATE_RANGE_FACTORY_REQUIRED = "DateRange must be created through DateRange.of";

    /** Lỗi dữ liệu: kiểu chuyến lạ trong cơ sở dữ liệu; tham số: mã. */
    public static final String UNKNOWN_TRIP_STYLE = "Unknown trip style in database: %s";

    /** Lỗi dữ liệu: "ai đi" lạ trong cơ sở dữ liệu; tham số: mã. */
    public static final String UNKNOWN_TRIP_KIND = "Unknown trip kind in database: %s";

    /** Lỗi dữ liệu: sở thích lạ trong cơ sở dữ liệu; tham số: mã. */
    public static final String UNKNOWN_TRIP_INTEREST = "Unknown trip interest in database: %s";

    /** Lỗi dữ liệu: nhịp chuyến lạ trong cơ sở dữ liệu; tham số: mã. */
    public static final String UNKNOWN_TRIP_PACE = "Unknown trip pace in database: %s";

    /** Lỗi dữ liệu: loại mục lạ trong cơ sở dữ liệu; tham số: mã. */
    public static final String UNKNOWN_ITEM_TYPE = "Unknown item type in database: %s";

    /** Lỗi dữ liệu: trạng thái đặt chỗ lạ trong cơ sở dữ liệu; tham số: mã. */
    public static final String UNKNOWN_BOOKING_STATUS = "Unknown booking status in database: %s";

    private PlanningMessages() {
    }

    /** Vai lạ trong dữ liệu (lỗi dữ liệu, không phải lỗi người dùng). */
    public static final String UNKNOWN_MEMBER_ROLE = "Unknown member role in database: %s";

    /** Liên kết mời không dùng được (một thông báo chung). */
    public static final String INVALID_INVITE = "Liên kết mời không hợp lệ hoặc đã hết hạn.";

    /** Chuyến đã đủ người. */
    public static final String TRIP_FULL = "Chuyến đi đã đủ số người tối đa.";

    /** Chỉ Organizer. */
    public static final String NOT_ORGANIZER = "Chỉ Organizer của chuyến làm được việc này.";

    /** Chỉ sửa được mục của mình. */
    public static final String NOT_YOUR_ITEM = "Bạn chỉ sửa hay xóa được mục do chính bạn thêm.";

    /** Organizer không rời chuyến. */
    public static final String ORGANIZER_CANNOT_LEAVE = "Organizer không rời hay bị gỡ khỏi chuyến của mình.";

    /** Tên hiển thị trống. */
    public static final String DISPLAY_NAME_REQUIRED = "Hãy nhập tên hiển thị.";

    /** Mục của mình thì xóa thẳng. */
    public static final String OWN_ITEM_DELETE_DIRECTLY = "Mục do bạn thêm thì bạn xóa thẳng được, không cần đề nghị.";

    /** Organizer xóa thẳng. */
    public static final String ORGANIZER_DELETES_DIRECTLY = "Organizer xóa thẳng được, không cần đề nghị.";

    /** Đã có đề nghị. */
    public static final String REQUEST_EXISTS = "Mục này đã có đề nghị xóa đang chờ duyệt.";

    /** Quá nhiều đề nghị chờ. */
    public static final String TOO_MANY_REQUESTS = "Bạn đang có quá nhiều đề nghị xóa chờ duyệt.";

    /** Đã quyết định. */
    public static final String ALREADY_DECIDED = "Đề nghị này đã được xử lý.";

    /** Trạng thái đề nghị lạ trong dữ liệu (lỗi dữ liệu). */
    public static final String UNKNOWN_REQUEST_STATUS = "Unknown deletion request status in database: %s";

    /** Thiếu mã mục trong đề nghị. */
    public static final String ITEM_REQUIRED = "Hãy chọn mục cần đề nghị xóa.";

    /** Checklist đầy. */
    public static final String CHECKLIST_FULL = "Checklist đã đủ số hạng mục tối đa.";

    /** Tên hạng mục trống. */
    public static final String CHECKLIST_TITLE_REQUIRED = "Hãy nhập tên hạng mục.";
}
