package com.wander.planning.domain.constant;

import java.util.List;

/**
 * Hằng số của module planning (tầng CHỨC NĂNG): giới hạn nội dung, định dạng nhập liệu, độ dài cột, cách hiển thị.
 * Mã lỗi ở {@link PlanningErrorCodes}, lời báo ở {@link PlanningMessages}. Các giới hạn là mặc định của implementation
 * (docs/implementation/decisions.md), đổi được.
 */
public final class PlanningConstants {

    /** Độ dài tối đa của tiêu đề mục. */
    public static final int MAX_TITLE = 200;

    /** Độ dài tối đa của ghi chú mục. */
    public static final int MAX_NOTE = 2000;

    /** Độ dài tối đa của tên chuyến. */
    public static final int MAX_TRIP_NAME = 120;

    /** Độ dài tối đa của điểm đến. */
    public static final int MAX_DESTINATION = 200;

    /** Độ dài tối đa của mã địa điểm trong kho (khớp {@code Place.id} ở catalog; hai module chỉ tham chiếu bằng mã). */
    public static final int MAX_PLACE_ID_LENGTH = 60;

    /** Mã địa điểm dạng slug: chữ thường, số, nối nhau bằng gạch ngang (khớp CHECK ở migration V4). */
    public static final String PLACE_ID_REGEX = "[a-z0-9]+(-[a-z0-9]+)*";

    /** Số phần tử tối đa của một lệnh gán ngày hàng loạt (bằng trần "Đã xóa gần đây", DR-020). */
    public static final int MAX_ASSIGNMENTS = 500;

    /** Dấu nối trước hậu tố số khi tên chuyến trùng (DR-006). */
    public static final String NAME_SUFFIX_SEPARATOR = " - ";

    /** Hậu tố số đầu tiên khi tên trùng: " - 2". */
    public static final int FIRST_NAME_SUFFIX = 2;

    /** Hậu tố số lớn nhất thử (loại trừ); hết thì dùng mã ngắn ngẫu nhiên. */
    public static final int MAX_NAME_SUFFIX = 200;

    /** Số ký tự của mã ngắn dùng khi hết hậu tố số. */
    public static final int NAME_SHORT_CODE_LENGTH = 4;

    /** Số ngày trong một tuần. */
    public static final int DAYS_PER_WEEK = 7;

    /** Số giờ trong một ngày. */
    public static final int HOURS_PER_DAY = 24;

    /** Số phút trong một giờ. */
    public static final int MINUTES_PER_HOUR = 60;

    /** Thời lượng tối đa của một mục, phút: 7 ngày (Q18b). */
    public static final int MAX_DURATION_MIN = DAYS_PER_WEEK * HOURS_PER_DAY * MINUTES_PER_HOUR;

    /** Giờ lớn nhất của giờ trong ngày (24 giờ). */
    public static final int MAX_HOUR = 23;

    /** Phút lớn nhất của giờ trong ngày. */
    public static final int MAX_MINUTE = 59;

    /** Chi phí tối đa, nghìn đồng (Q18d). */
    public static final long MAX_COST_K = 1_000_000_000L;

    /** Số chữ số tối đa của một chi phí dạng chuỗi sau khi bỏ số 0 đứng đầu (đủ chứa {@link #MAX_COST_K}). */
    public static final int MAX_AMOUNT_DIGITS = 10;

    /** Số ngày tối đa của một chuyến (gồm hai đầu). */
    public static final int MAX_DAYS = 366;

    /** Số kiểu chuyến tối đa chọn cùng lúc. */
    public static final int MAX_STYLES = 5;

    /** Nhãn thứ trong tuần, chỉ số 0 là Chủ nhật. */
    public static final List<String> WEEKDAY_LABELS = List.of("CN", "T2", "T3", "T4", "T5", "T6", "T7");

    /** Ngày dạng YYYY-MM-DD. */
    public static final String ISO_DATE_REGEX = "^\\d{4}-\\d{2}-\\d{2}$";

    /** Giờ dạng HH:MM, hai nhóm là giờ và phút. */
    public static final String TIME_OF_DAY_REGEX = "^(\\d{2}):(\\d{2})$";

    /** Mẫu hiển thị giờ trong ngày. */
    public static final String TIME_OF_DAY_PATTERN = "HH:mm";

    /** Chuỗi chỉ gồm chữ số. */
    public static final String DIGITS_REGEX = "^\\d+$";

    /** Chuỗi là số nguyên âm. */
    public static final String NEGATIVE_DIGITS_REGEX = "^-\\d+$";

    /** Số 0 đứng đầu cần bỏ (giữ lại một chữ số). */
    public static final String LEADING_ZEROS_REGEX = "^0+(?=\\d)";

    /** Dấu ngăn cách các mã kiểu chuyến khi lưu thành một cột. */
    public static final String STYLE_CODE_SEPARATOR = ",";

    /** Số lần nghìn: 1 nghìn đồng = 1.000 đồng. */
    public static final long VND_PER_THOUSAND = 1000;

    /** Số chữ số mỗi nhóm khi hiển thị tiền. */
    public static final int VND_GROUP_SIZE = 3;

    /** Dấu ngăn nhóm nghìn của tiền (như vi-VN). */
    public static final char VND_GROUP_SEPARATOR = '.';

    /** Hậu tố hiển thị tiền. */
    public static final String VND_SUFFIX = " ₫";

    /** Dấu âm khi hiển thị tiền. */
    public static final String VND_MINUS = "-";

    /** Độ dài cột {@code trips.styles}. */
    public static final int STYLES_COLUMN_LENGTH = 100;

    /** Độ dài cột {@code trips.pace}. */
    public static final int PACE_COLUMN_LENGTH = 16;

    /** Độ dài cột {@code items.type}. */
    public static final int ITEM_TYPE_COLUMN_LENGTH = 32;

    /** Độ dài cột {@code items.booking_status}. */
    public static final int BOOKING_COLUMN_LENGTH = 16;

    private PlanningConstants() {
    }
}
