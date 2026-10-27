package com.wander.planning.application.input;

import com.wander.planning.domain.constant.PlanningConstants;
import com.wander.planning.domain.constant.PlanningErrorCodes;
import com.wander.planning.domain.constant.PlanningFields;
import com.wander.planning.domain.constant.PlanningMessages;
import com.wander.planning.domain.model.DayAssignment;
import com.wander.planning.domain.rule.ItemText;
import com.wander.planning.domain.vocabulary.BookingStatus;
import com.wander.planning.domain.vocabulary.ItemType;
import com.wander.planning.domain.vocabulary.TripPace;
import com.wander.planning.domain.vocabulary.TripStyle;
import com.wander.shared.kernel.constant.ErrorCodes;
import com.wander.shared.kernel.error.WanderException;
import com.wander.shared.kernel.util.Ids;
import java.math.BigDecimal;
import java.math.BigInteger;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Chuyển giá trị JSON "thô" (String, Number, Boolean, null) thành giá trị đã kiểm tra.
 * Đây là quy tắc nhập liệu của sản phẩm (D17: "1.5" hay "150k" là định dạng sai, không tự đoán),
 * nên nằm ở tầng application chứ không giao cho Jackson ép kiểu.
 */
public final class RawInput {

    private static final Pattern ISO_DATE = Pattern.compile(PlanningConstants.ISO_DATE_REGEX);
    private static final Pattern TIME = Pattern.compile(PlanningConstants.TIME_OF_DAY_REGEX);
    private static final Pattern DIGITS = Pattern.compile(PlanningConstants.DIGITS_REGEX);
    private static final Pattern NEGATIVE_DIGITS = Pattern.compile(PlanningConstants.NEGATIVE_DIGITS_REGEX);

    private RawInput() {
    }

    /** Giá trị vắng mặt theo nghĩa của API: null hoặc chuỗi rỗng. */
    public static boolean isMissing(Object value) {
        return value == null || "".equals(value);
    }

    /** Ngày dạng YYYY-MM-DD, phải là ngày lịch có thật; sai thì trả null. */
    public static LocalDate isoDateOrNull(Object value) {
        if (!(value instanceof String text) || !ISO_DATE.matcher(text).matches()) return null;
        try {
            return LocalDate.parse(text);
        } catch (DateTimeParseException e) {
            return null;
        }
    }

    /**
     * Danh sách gán ngày hàng loạt: mảng các đối tượng {@code {itemId, day?, position?}}. Không phải mảng hoặc phần tử không
     * phải đối tượng thì MALFORMED; quá {@value PlanningConstants#MAX_ASSIGNMENTS} phần tử thì TOO_MANY; mã mục không phải UUID
     * coi như mục không tồn tại (404).
     */
    public static List<DayAssignment> assignments(Object value) {
        if (!(value instanceof List<?> raw)) throw invalidAssignments();
        if (raw.size() > PlanningConstants.MAX_ASSIGNMENTS) {
            throw WanderException.invalidValue(ErrorCodes.TOO_MANY, PlanningFields.ASSIGNMENTS);
        }
        List<DayAssignment> assignments = new ArrayList<>();
        for (Object element : raw) assignments.add(assignment(element));
        return assignments;
    }

    /** Ngày tùy chọn của mục: null = "Chưa có ngày" (DR-011 A1); có giá trị thì phải đúng như {@link #day(Object)}. */
    public static LocalDate dayOrNull(Object value) {
        return value == null ? null : day(value);
    }

    /** Mã địa điểm trong kho: null hoặc trống = không liên kết; không phải chuỗi thì MALFORMED, sai dạng thì báo như {@link ItemText#placeId}. */
    public static String placeId(Object value) {
        if (value == null) return null;
        if (!(value instanceof String text)) throw WanderException.invalidValue(ErrorCodes.MALFORMED, PlanningFields.PLACE_ID);
        return ItemText.placeId(text);
    }

    /** Ngày của mục; sai thì báo INVALID_DATE ở trường {@code day}. */
    public static LocalDate day(Object value) {
        LocalDate date = isoDateOrNull(value);
        if (date == null) {
            throw WanderException.invalid(PlanningErrorCodes.INVALID_DATE, PlanningMessages.DAY_INVALID, PlanningFields.DAY);
        }
        return date;
    }

    /** Loại mục theo mã; sai thì báo INVALID_TYPE. */
    public static ItemType type(Object value) {
        if (value instanceof String code) {
            Optional<ItemType> type = ItemType.fromCode(code);
            if (type.isPresent()) return type.get();
        }
        throw WanderException.invalid(PlanningErrorCodes.INVALID_TYPE, PlanningMessages.TYPE_INVALID, PlanningFields.TYPE);
    }

    /**
     * Trạng thái đặt chỗ (A-14): chuỗi phải là "pending" hoặc "booked". {@code null} được gửi tường minh có nghĩa là
     * "Chờ xác nhận" (mặc định theo loại mục); muốn giữ nguyên khi sửa thì KHÔNG gửi khóa {@code booking}.
     */
    public static BookingStatus booking(Object value) {
        if (value == null) return null;
        if (value instanceof String code) {
            Optional<BookingStatus> status = BookingStatus.fromCode(code);
            if (status.isPresent()) return status.get();
        }
        throw WanderException.invalid(PlanningErrorCodes.INVALID_BOOKING, PlanningMessages.BOOKING_INVALID, PlanningFields.BOOKING);
    }

    /** Ngân sách dự kiến (Q11): như chi phí D17 (nghìn đồng, số nguyên không âm); null hoặc chuỗi rỗng = chưa đặt. */
    public static Long budget(Object value) {
        return amountK(value, PlanningFields.BUDGET);
    }

    /** Kiểu chuyến (Q11): danh sách mã; null hoặc chuỗi rỗng = không có kiểu nào (như ngân sách và nhịp). */
    public static List<TripStyle> styles(Object value) {
        if (isMissing(value)) return List.of();
        if (!(value instanceof List<?> raw)) throw invalidStyle();
        List<TripStyle> styles = new ArrayList<>();
        for (Object element : raw) {
            if (!(element instanceof String code)) throw invalidStyle();
            styles.add(TripStyle.fromCode(code).orElseThrow(RawInput::invalidStyle));
        }
        return styles;
    }

    /** Nhịp chuyến (Q11): mã hoặc null/chuỗi rỗng = chưa đặt. */
    public static TripPace pace(Object value) {
        if (isMissing(value)) return null;
        if (value instanceof String code) {
            Optional<TripPace> pace = TripPace.fromCode(code);
            if (pace.isPresent()) return pace.get();
        }
        throw WanderException.invalid(PlanningErrorCodes.INVALID_PACE, PlanningMessages.PACE_INVALID, PlanningFields.PACE);
    }

    /** Tiêu đề mục: bắt buộc, phải là chuỗi; thiếu thì REQUIRED, sai kiểu thì MALFORMED. */
    public static String title(Object value) {
        if (!(value instanceof String text)) {
            throw WanderException.invalidValue(value == null ? ErrorCodes.REQUIRED : ErrorCodes.MALFORMED, PlanningFields.TITLE);
        }
        return ItemText.title(text);
    }

    /** Ghi chú mục: null giữ nguyên null; phải là chuỗi. */
    public static String note(Object value) {
        if (value == null) return null;
        if (!(value instanceof String text)) throw WanderException.invalidValue(ErrorCodes.MALFORMED, PlanningFields.NOTE);
        return ItemText.note(text);
    }

    /** Văn bản bắt buộc của chuyến (tên, điểm đến). */
    public static String requiredText(Object value, int max, String field) {
        if (!(value instanceof String text) || text.strip().isEmpty()) {
            throw WanderException.invalid(ErrorCodes.REQUIRED, PlanningMessages.FIELD_REQUIRED, field);
        }
        return ItemText.required(text, max, field);
    }

    /** Giờ tùy chọn "HH:MM" 24 giờ; trống ⇒ null. */
    public static LocalTime timeOfDay(Object value) {
        if (value == null) return null;
        if (!(value instanceof String raw)) throw WanderException.invalidValue(ErrorCodes.MALFORMED, PlanningFields.TIME_OF_DAY);
        String text = raw.strip();
        if (text.isEmpty()) return null;
        Matcher matcher = TIME.matcher(text);
        if (!matcher.matches()) throw WanderException.invalidValue(ErrorCodes.MALFORMED, PlanningFields.TIME_OF_DAY);
        int hour = Integer.parseInt(matcher.group(1));
        int minute = Integer.parseInt(matcher.group(2));
        if (hour > PlanningConstants.MAX_HOUR || minute > PlanningConstants.MAX_MINUTE) {
            throw WanderException.invalidValue(ErrorCodes.OUT_OF_RANGE, PlanningFields.TIME_OF_DAY);
        }
        return LocalTime.of(hour, minute);
    }

    /** Thời lượng tùy chọn: số nguyên phút trong [0, 7 ngày]. Giờ + thời lượng qua nửa đêm vẫn hợp lệ (Q18b). */
    public static Integer durationMin(Object value) {
        if (isMissing(value)) return null;
        BigDecimal minutes = wholeNumberOrMalformed(value, PlanningFields.DURATION_MIN);
        if (minutes.signum() < 0 || minutes.compareTo(BigDecimal.valueOf(PlanningConstants.MAX_DURATION_MIN)) > 0) {
            throw WanderException.invalidValue(ErrorCodes.OUT_OF_RANGE, PlanningFields.DURATION_MIN);
        }
        return minutes.intValueExact();
    }

    /**
     * Chi phí (nghìn đồng) theo D17: trống ⇒ chưa biết (null); số nguyên không âm; số thập phân, dấu phân cách,
     * ký hiệu tiền tệ đều là định dạng sai.
     */
    public static Long amountK(Object value, String field) {
        if (value == null) return null;
        if (value instanceof Number number) return amountFromNumber(number, field);
        if (value instanceof String raw) return amountFromText(raw.strip(), field);
        throw WanderException.invalidValue(ErrorCodes.MALFORMED, field);
    }

    /** Giá trị đúng/sai bắt buộc; sai kiểu thì MALFORMED. */
    public static boolean bool(Object value, String field) {
        if (value instanceof Boolean flag) return flag;
        throw WanderException.invalidValue(ErrorCodes.MALFORMED, field);
    }

    /** Vị trí yêu cầu: chỉ nhận số (cắt phần thập phân), ngược lại bỏ qua. */
    public static Integer position(Object value) {
        if (!(value instanceof Number number)) return null;
        BigDecimal decimal = toDecimal(number);
        if (decimal == null) return null;
        BigInteger whole = decimal.toBigInteger();
        if (whole.compareTo(BigInteger.valueOf(Integer.MAX_VALUE)) > 0) return Integer.MAX_VALUE;
        if (whole.compareTo(BigInteger.valueOf(Integer.MIN_VALUE)) < 0) return 0;
        return whole.intValue();
    }

    /** Một phần tử gán ngày: đối tượng có {@code itemId} hợp lệ, {@code day} tùy chọn và {@code position} tùy chọn. */
    private static DayAssignment assignment(Object element) {
        if (!(element instanceof Map<?, ?> fields)) throw invalidAssignments();
        UUID itemId = fields.get(PlanningFields.ITEM_ID) instanceof String raw
                ? Ids.parse(raw).orElseThrow(WanderException::notFound) : null;
        if (itemId == null) throw WanderException.notFound();
        return new DayAssignment(itemId, dayOrNull(fields.get(PlanningFields.DAY)), position(fields.get(PlanningFields.POSITION)));
    }

    /** Lỗi danh sách gán ngày sai dạng. */
    private static WanderException invalidAssignments() {
        return WanderException.invalid(ErrorCodes.MALFORMED, PlanningMessages.ASSIGNMENTS_MALFORMED, PlanningFields.ASSIGNMENTS);
    }

    /** Lỗi kiểu chuyến không hợp lệ. */
    private static WanderException invalidStyle() {
        return WanderException.invalid(PlanningErrorCodes.INVALID_STYLE, PlanningMessages.STYLE_INVALID, PlanningFields.STYLES);
    }

    /** Số nguyên (không có phần thập phân) từ số JSON hoặc chuỗi chỉ gồm chữ số; mọi dạng khác báo MALFORMED. */
    private static BigDecimal wholeNumberOrMalformed(Object value, String field) {
        BigDecimal decimal;
        if (value instanceof Number number) {
            decimal = toDecimal(number);
            if (decimal == null) throw WanderException.invalidValue(ErrorCodes.MALFORMED, field);
        } else if (value instanceof String text && DIGITS.matcher(text.strip()).matches()) {
            decimal = new BigDecimal(text.strip());
        } else {
            throw WanderException.invalidValue(ErrorCodes.MALFORMED, field);
        }
        if (decimal.stripTrailingZeros().scale() > 0) throw WanderException.invalidValue(ErrorCodes.MALFORMED, field);
        return decimal;
    }

    /** Chi phí từ số JSON: phải là số nguyên hữu hạn, không âm, không quá lớn. */
    private static Long amountFromNumber(Number number, String field) {
        BigDecimal decimal = toDecimal(number);
        if (decimal == null || decimal.stripTrailingZeros().scale() > 0) throw WanderException.invalidValue(ErrorCodes.MALFORMED, field);
        return checkedAmount(decimal, field);
    }

    /** Chi phí từ chuỗi đã cắt khoảng trắng: rỗng ⇒ null; chỉ nhận chữ số; số âm và số quá lớn có mã lỗi riêng. */
    private static Long amountFromText(String text, String field) {
        if (text.isEmpty()) return null;
        if (NEGATIVE_DIGITS.matcher(text).matches()) throw WanderException.invalidValue(ErrorCodes.NEGATIVE, field);
        if (!DIGITS.matcher(text).matches()) throw WanderException.invalidValue(ErrorCodes.MALFORMED, field);
        if (text.replaceFirst(PlanningConstants.LEADING_ZEROS_REGEX, "").length() > PlanningConstants.MAX_AMOUNT_DIGITS) {
            throw WanderException.invalidValue(ErrorCodes.TOO_LARGE, field);
        }
        return checkedAmount(new BigDecimal(text), field);
    }

    /** Số đã là số nguyên: không âm và không vượt mức tối đa. */
    private static Long checkedAmount(BigDecimal amount, String field) {
        if (amount.signum() < 0) throw WanderException.invalidValue(ErrorCodes.NEGATIVE, field);
        if (amount.compareTo(BigDecimal.valueOf(PlanningConstants.MAX_COST_K)) > 0) {
            throw WanderException.invalidValue(ErrorCodes.TOO_LARGE, field);
        }
        return amount.longValueExact();
    }

    /** Số JSON → BigDecimal; NaN/vô cực ⇒ null. */
    private static BigDecimal toDecimal(Number number) {
        if (number instanceof BigDecimal decimal) return decimal;
        if (number instanceof BigInteger integer) return new BigDecimal(integer);
        if (number instanceof Double || number instanceof Float) {
            double value = number.doubleValue();
            if (Double.isNaN(value) || Double.isInfinite(value)) return null;
            return BigDecimal.valueOf(value);
        }
        return BigDecimal.valueOf(number.longValue());
    }
}
